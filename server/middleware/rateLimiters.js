let client = null;
let redisEnabled = false;

const memoryStore = new Map();

const getMemoryRecord = (key, windowInSeconds) => {
  const now = Date.now();
  const existing = memoryStore.get(key);
  if (!existing || existing.expiresAt <= now) {
    const record = { count: 1, expiresAt: now + windowInSeconds * 1000 };
    memoryStore.set(key, record);
    return record;
  }
  existing.count += 1;
  return existing;
};

const redisUrl = process.env.REDIS_URL || '';
const redisEnabledEnv = process.env.REDIS_ENABLED;
const shouldUseRedis =
  typeof redisEnabledEnv === 'string'
    ? redisEnabledEnv.toLowerCase() === 'true'
    : Boolean(redisUrl);

if (shouldUseRedis && redisUrl) {
  try {
    const { createClient } = require('redis');
    client = createClient({ url: redisUrl });
    client.on('error', (err) => console.log('Redis Client Error', err));
    client
      .connect()
      .then(() => {
        redisEnabled = true;
      })
      .catch((err) => console.log('Redis Connection Error:', err));
  } catch (error) {
    console.warn('Redis not available, falling back to in-memory rate limiting.');
  }
} else if (redisEnabledEnv && redisEnabledEnv.toLowerCase() === 'false') {
  console.warn('Redis disabled via REDIS_ENABLED=false. Using in-memory rate limiting.');
}

// Helper function for rate limiting
const limitRequest = async (req, res, next, keyPrefix, limit, windowInSeconds) => {
  try {
    const ip = req.ip;
    const key = `${keyPrefix}:${ip}`;

    if (redisEnabled && client?.isOpen) {
      const requests = await client.incr(key);
      if (requests === 1) {
        await client.expire(key, windowInSeconds);
      }
      if (requests > limit) {
        return res.status(429).json({
          message: 'Too many requests, please try again later.',
          retryAfter: windowInSeconds,
        });
      }
      return next();
    }

    const record = getMemoryRecord(key, windowInSeconds);
    if (record.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000));
      return res.status(429).json({
        message: 'Too many requests, please try again later.',
        retryAfter,
      });
    }

    return next();
  } catch (error) {
    console.error('Rate Limiter Error:', error);
    // Fail open: allow request if Redis is down to prevent downtime
    next();
  }
};

// Global API Limiter (e.g., 100 requests per 15 minutes)
const apiLimiter = (req, res, next) => {
  limitRequest(req, res, next, 'global_limit', 100, 15 * 60);
};

// Login Limiter (e.g., 5 attempts per 15 minutes)
const loginLimiter = (req, res, next) => {
  limitRequest(req, res, next, 'login_limit', 5, 15 * 60);
};

// Auth Limiter for register/login (e.g., 15 requests per 15 minutes)
const authLimiter = (req, res, next) => {
  limitRequest(req, res, next, 'auth_limit', 15, 15 * 60);
};

// OTP Limiter (e.g., 5 requests per 10 minutes)
const otpLimiter = (req, res, next) => {
  limitRequest(req, res, next, 'otp_limit', 5, 10 * 60);
};

module.exports = { apiLimiter, loginLimiter, authLimiter, otpLimiter };
