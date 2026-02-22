const crypto = require('crypto');

const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'csrf-token';
const CSRF_HEADER_NAME = (process.env.CSRF_HEADER_NAME || 'x-csrf-token').toLowerCase();
const CSRF_ENABLED = process.env.CSRF_ENABLED !== 'false';
const CSRF_SAMESITE = (process.env.CSRF_SAMESITE || 'lax').toLowerCase();
const CSRF_SECURE =
  process.env.CSRF_SECURE === 'true' ||
  (process.env.NODE_ENV === 'production' && CSRF_SAMESITE === 'none');
const CSRF_MAX_AGE = Number(process.env.CSRF_MAX_AGE) || 0;
const CSRF_ALLOW_NO_ORIGIN =
  process.env.CSRF_ALLOW_NO_ORIGIN === 'true' || process.env.NODE_ENV !== 'production';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const parseCookies = (cookieHeader) => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, chunk) => {
    const [rawKey, ...rest] = chunk.trim().split('=');
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rest.join('=') || '');
    return acc;
  }, {});
};

const buildCsrfCookie = (token) => {
  const normalizedSameSite =
    CSRF_SAMESITE === 'strict' || CSRF_SAMESITE === 'none' || CSRF_SAMESITE === 'lax'
      ? CSRF_SAMESITE
      : 'lax';
  const cookieParts = [
    `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    `SameSite=${normalizedSameSite[0].toUpperCase()}${normalizedSameSite.slice(1)}`,
  ];
  if (CSRF_SECURE) {
    cookieParts.push('Secure');
  }
  if (CSRF_MAX_AGE > 0) {
    cookieParts.push(`Max-Age=${CSRF_MAX_AGE}`);
  }
  return cookieParts.join('; ');
};

const shouldSkipCsrf = (req) => {
  if (!CSRF_ENABLED) return true;
  if (SAFE_METHODS.has(req.method)) return true;
  if (req.headers.authorization) return true;
  if (!req.headers.origin && CSRF_ALLOW_NO_ORIGIN) return true;
  return false;
};

const csrfProtection = (req, res, next) => {
  const cookies = parseCookies(req.headers.cookie);
  let token = cookies[CSRF_COOKIE_NAME] || null;

  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    if (CSRF_ENABLED) {
      res.setHeader('Set-Cookie', buildCsrfCookie(token));
    }
  }

  req.csrfToken = token;

  if (shouldSkipCsrf(req)) {
    return next();
  }

  const headerToken = req.headers[CSRF_HEADER_NAME];
  if (!headerToken || headerToken !== token) {
    return res.status(403).json({
      message: 'Missing or invalid CSRF token. Fetch /api/csrf first.',
    });
  }

  return next();
};

const getCsrfToken = (req, res) => {
  res.status(200).json({ csrfToken: req.csrfToken });
};

module.exports = { csrfProtection, getCsrfToken };
