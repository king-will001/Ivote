const parseCookies = (cookieHeader) => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, chunk) => {
    const [rawKey, ...rest] = chunk.trim().split('=');
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rest.join('=') || '');
    return acc;
  }, {});
};

const getCookieValue = (req, name) => {
  const cookies = parseCookies(req.headers?.cookie || '');
  return cookies[name] || null;
};

module.exports = {
  parseCookies,
  getCookieValue,
};
