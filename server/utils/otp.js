const crypto = require('crypto');

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

const generateOtpCode = () => {
  const max = 10 ** OTP_LENGTH;
  return crypto.randomInt(0, max).toString().padStart(OTP_LENGTH, '0');
};

const hashOtp = (code) => crypto.createHash('sha256').update(code).digest('hex');

module.exports = {
  generateOtpCode,
  hashOtp,
  OTP_TTL_MINUTES,
  OTP_MAX_ATTEMPTS,
};
