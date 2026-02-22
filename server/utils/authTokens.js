const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const refreshDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS);
const REFRESH_TOKEN_TTL =
  process.env.REFRESH_TOKEN_TTL ||
  (Number.isFinite(refreshDays) ? `${refreshDays}d` : '7d');

const ACCESS_COOKIE_NAME = process.env.ACCESS_COOKIE_NAME || 'accessToken';
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'refreshToken';
const ACCESS_COOKIE_PATH = process.env.ACCESS_COOKIE_PATH || '/';
const REFRESH_COOKIE_PATH = process.env.REFRESH_COOKIE_PATH || '/api/voters';

const parseDurationToMs = (value, fallbackMs) => {
  if (!value) return fallbackMs;
  if (typeof value === 'number') return value;
  const raw = String(value).trim();
  const match = raw.match(/^(\d+)(ms|s|m|h|d)$/i);
  if (!match) {
    const asNumber = Number(raw);
    return Number.isFinite(asNumber) ? asNumber : fallbackMs;
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 'ms':
      return amount;
    case 's':
      return amount * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 'h':
      return amount * 60 * 60 * 1000;
    case 'd':
      return amount * 24 * 60 * 60 * 1000;
    default:
      return fallbackMs;
  }
};

const ACCESS_TOKEN_TTL_MS = parseDurationToMs(ACCESS_TOKEN_TTL, 15 * 60 * 1000);
const REFRESH_TOKEN_TTL_MS = parseDurationToMs(
  REFRESH_TOKEN_TTL,
  7 * 24 * 60 * 60 * 1000
);

const resolveCookieOptions = () => {
  const rawSameSite = String(process.env.AUTH_COOKIE_SAMESITE || 'lax').toLowerCase();
  const sameSite =
    rawSameSite === 'strict' || rawSameSite === 'none' || rawSameSite === 'lax'
      ? rawSameSite
      : 'lax';
  const secure =
    process.env.AUTH_COOKIE_SECURE === 'true' ||
    (process.env.NODE_ENV === 'production' && sameSite === 'none');
  const domain = process.env.AUTH_COOKIE_DOMAIN || undefined;
  return { httpOnly: true, secure, sameSite, domain };
};

const hashToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

const signAccessToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Server misconfiguration: JWT secret missing');
  }
  return jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_TTL });
};

const createRefreshToken = () => {
  const token = crypto.randomBytes(64).toString('hex');
  const hash = hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  return { token, hash, expiresAt };
};

const attachAuthCookies = (res, { accessToken, refreshToken }) => {
  const baseOptions = resolveCookieOptions();
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    ...baseOptions,
    path: ACCESS_COOKIE_PATH,
    maxAge: ACCESS_TOKEN_TTL_MS,
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...baseOptions,
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
};

const clearAuthCookies = (res) => {
  const baseOptions = resolveCookieOptions();
  res.clearCookie(ACCESS_COOKIE_NAME, { ...baseOptions, path: ACCESS_COOKIE_PATH });
  res.clearCookie(REFRESH_COOKIE_NAME, { ...baseOptions, path: REFRESH_COOKIE_PATH });
};

module.exports = {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  ACCESS_TOKEN_TTL,
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  hashToken,
  signAccessToken,
  createRefreshToken,
  attachAuthCookies,
  clearAuthCookies,
};
