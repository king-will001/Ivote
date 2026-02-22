const crypto = require('crypto');

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES) || 10;
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 5;

const generateOtpCode = () => {
  const buffer = crypto.randomBytes(4);
  const value = buffer.readUInt32BE(0) % 1000000;
  return String(value).padStart(6, '0');
};

const hashOtp = (code) =>
  crypto.createHash('sha256').update(String(code)).digest('hex');

module.exports = {
  OTP_TTL_MINUTES,
  OTP_MAX_ATTEMPTS,
  generateOtpCode,
  hashOtp,
};
