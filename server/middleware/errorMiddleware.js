const HttpError = require('../models/ErrorModal');

// unsupported/404 endpoints
const notFound = (req, res, next) => {
  next(new HttpError(`Not Found - ${req.originalUrl}`, 404));
};

// Error middleware
const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const fallbackStatus = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const statusCode = error.code || error.status || fallbackStatus;
  const message = error.message || 'An unknown error occurred!';

  res.status(statusCode).json({ message });
};

module.exports = {
  notFound,
  errorHandler,
};
