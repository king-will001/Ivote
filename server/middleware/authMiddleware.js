const jwt = require('jsonwebtoken');
const HttpError = require('../models/ErrorModal');
const VoterModel = require('../models/voterModel');
const { getCookieValue } = require('../utils/cookies');
const { ACCESS_COOKIE_NAME } = require('../utils/authTokens');

const getBearerToken = (req) => {
  const header = String(req.headers?.authorization || '').trim();
  if (!header) return null;
  const [scheme, ...rest] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer') {
    return null;
  }
  const token = rest.join(' ').trim();
  return token || null;
};

const getAccessToken = (req) => getBearerToken(req) || getCookieValue(req, ACCESS_COOKIE_NAME);

const resolveJwtErrorMessage = (error) => {
  if (error?.name === 'TokenExpiredError') {
    return 'Unauthorized - Token expired';
  }
  return 'Unauthorized - Invalid token';
};

const hydrateUser = async (payload) => {
  if (!payload?.id) return null;
  const voter = await VoterModel.findById(payload.id)
    .select('email firstName lastName isAdmin isVerified')
    .lean();
  if (!voter) return null;
  return {
    id: voter._id,
    email: voter.email,
    firstName: voter.firstName,
    lastName: voter.lastName,
    isAdmin: voter.isAdmin,
    isVerified: voter.isVerified,
  };
};

const authenticateRequest = async (req) => {
  const token = getAccessToken(req);
  if (!token) {
    throw new HttpError('Unauthorized - Missing or invalid token', 401);
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new HttpError('Server misconfiguration: JWT secret missing', 500);
  }
  const payload = jwt.verify(token, secret);
  const user = await hydrateUser(payload);
  if (!user) {
    throw new HttpError('Unauthorized - User not found', 401);
  }
  if (!user.isVerified) {
    throw new HttpError('Forbidden - Account not verified', 403);
  }
  return user;
};

const verifyToken = async (req, res, next) => {
  try {
    req.user = await authenticateRequest(req);
    return next();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('JWT verification failed:', error?.message || error);
    }
    if (error instanceof HttpError || error?.code) {
      return next(error);
    }
    return next(new HttpError(resolveJwtErrorMessage(error), 401));
  }
};

const optionalAuth = async (req, res, next) => {
  const token = getAccessToken(req);
  if (!token) {
    return next();
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next(new HttpError('Server misconfiguration: JWT secret missing', 500));
  }
  try {
    const payload = jwt.verify(token, secret);
    const user = await hydrateUser(payload);
    if (user?.isVerified) {
      req.user = user;
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Optional JWT verification failed:', error?.message || error);
    }
  }
  return next();
};

const verifyAdminToken = async (req, res, next) => {
  try {
    req.user = await authenticateRequest(req);
    if (!req.user?.isAdmin) {
      return next(new HttpError('Forbidden - Admin access required', 403));
    }
    return next();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Admin token verification failed:', error?.message || error);
    }
    if (error instanceof HttpError || error?.code) {
      return next(error);
    }
    return next(new HttpError(resolveJwtErrorMessage(error), 401));
  }
};

module.exports = {
  verifyToken,
  verifyAdminToken,
  optionalAuth,
};
