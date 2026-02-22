const crypto = require('crypto');

const csrfProtection = (req, res, next) => {
  // 1. Retrieve the token from the cookie manually (since cookie-parser might not be installed)
  const cookies = req.headers.cookie ? req.headers.cookie.split('; ') : [];
  const csrfCookie = cookies.find(c => c.startsWith('csrf-token='));
  let token = csrfCookie ? csrfCookie.split('=')[1] : null;

  // 2. If no token exists, generate one and set it
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    // Set cookie: Not HttpOnly so the frontend can read it and send it in the header
    res.setHeader('Set-Cookie', `csrf-token=${token}; Path=/; SameSite=Strict`);
  }

  // 3. Verify token on state-changing methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const headerToken = req.headers['x-csrf-token'];

    if (!headerToken || headerToken !== token) {
      return res.status(403).json({ message: 'Invalid CSRF Token' });
    }
  }

  // Attach token to request for convenience
  req.csrfToken = token;
  next();
};

module.exports = { csrfProtection };