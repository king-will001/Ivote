const { validationResult } = require('express-validator');
const HttpError = require('../models/ErrorModal');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const message = errors
    .array()
    .map((error) => error.msg)
    .filter(Boolean)
    .join(', ');
  return next(new HttpError(message || 'Invalid request', 422));
};

module.exports = { validateRequest };
