const { createClient } = require('redis');

// Initialize Redis Client
const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));

// Connect to Redis
(async () => {
  await client.connect();
})();

// Helper function for rate limiting
const limitRequest = async (req, res, next, keyPrefix, limit, windowInSeconds) => {
  try {
    const ip = req.ip;
    const key = `${keyPrefix}:${ip}`;

    const requests = await client.incr(key);

    if (requests === 1) {
      await client.expire(key, windowInSeconds);
    }

    if (requests > limit) {
      return res.status(429).json({
        message: 'Too many requests, please try again later.',
        retryAfter: windowInSeconds
      });
    }

    next();
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

// Login Limiter (e.g., 5 attempts per 15 minutes) - Matches your Untitled-1.js logic
const loginLimiter = (req, res, next) => {
  limitRequest(req, res, next, 'login_limit', 5, 15 * 60);
};

module.exports = { apiLimiter, loginLimiter };