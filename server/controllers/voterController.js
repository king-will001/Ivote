const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Joi = require('joi');
const mongoose = require('mongoose');
const VoterModel = require('../models/voterModel');
const OtpModel = require('../models/OtpModel');
const HttpError = require('../models/ErrorModal');
const { getCookieValue } = require('../utils/cookies');
const {
  REFRESH_COOKIE_NAME,
  attachAuthCookies,
  clearAuthCookies,
  createRefreshToken,
  hashToken,
  signAccessToken,
} = require('../utils/authTokens');
const { sendOtpEmail, isEmailConfigured } = require('../utils/email');
const {
  generateOtpCode,
  hashOtp,
  OTP_TTL_MINUTES,
  OTP_MAX_ATTEMPTS,
} = require('../utils/otp');

const adminEmailList = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const isAdminEmail = (email) => adminEmailList.includes(email);
const isProduction = process.env.NODE_ENV === 'production';
const bcryptRoundsEnv = Number(process.env.BCRYPT_SALT_ROUNDS);
const BCRYPT_SALT_ROUNDS = Number.isFinite(bcryptRoundsEnv)
  ? Math.max(8, Math.min(15, bcryptRoundsEnv))
  : isProduction
    ? 12
    : 10;
const otpEmailAsyncEnv = String(process.env.OTP_EMAIL_ASYNC || '').toLowerCase();
const OTP_EMAIL_ASYNC =
  otpEmailAsyncEnv === 'true' || (otpEmailAsyncEnv !== 'false' && !isProduction);

const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(plainPassword, salt);
};

const formatVoterResponse = (voter) => ({
  id: voter._id,
  firstName: voter.firstName,
  lastName: voter.lastName,
  email: voter.email,
  isAdmin: voter.isAdmin,
  votedElections: voter.votedElections || [],
});

const refreshTokenMatches = (storedHash, incomingToken) => {
  if (!storedHash || !incomingToken) return false;
  const incomingHash = hashToken(incomingToken);
  const storedBuffer = Buffer.from(String(storedHash));
  const incomingBuffer = Buffer.from(String(incomingHash));
  if (storedBuffer.length !== incomingBuffer.length) return false;
  return crypto.timingSafeEqual(storedBuffer, incomingBuffer);
};

const issueAuthSession = async (voter, res) => {
  const accessToken = signAccessToken({ id: voter._id });
  const refreshToken = createRefreshToken();

  await VoterModel.findByIdAndUpdate(voter._id, {
    $set: {
      refreshTokenHash: refreshToken.hash,
      refreshTokenExpiresAt: refreshToken.expiresAt,
      refreshTokenCreatedAt: new Date(),
    },
  });

  attachAuthCookies(res, {
    accessToken,
    refreshToken: refreshToken.token,
  });
};

const deliverOtp = async ({ email, purpose, code, expiresAt }) => {
  if (!isEmailConfigured) {
    if (!isProduction) {
      console.warn(`OTP delivery skipped (${purpose}) for ${email}: SMTP not configured`, code);
      return false;
    }
    throw new Error('SMTP email service not configured');
  }

  if (OTP_EMAIL_ASYNC) {
    sendOtpEmail({ to: email, code, purpose, expiresAt }).catch((error) => {
      console.error(`OTP delivery failed (${purpose}) for ${email}:`, error?.message || error);
    });
    return true;
  }

  try {
    await sendOtpEmail({ to: email, code, purpose, expiresAt });
    return true;
  } catch (error) {
    if (!isProduction) {
      console.warn(
        `OTP delivery skipped (${purpose}) for ${email}:`,
        error?.message || error,
        code
      );
      return false;
    }
    throw error;
  }
};

const createAndSendOtp = async ({ email, purpose }) => {
  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await OtpModel.findOneAndUpdate(
    { email, purpose },
    {
      $set: {
        codeHash: hashOtp(otpCode),
        expiresAt,
        attempts: 0,
      },
    },
    { upsert: true, sort: { createdAt: -1 } }
  );

  return deliverOtp({ email, purpose, code: otpCode, expiresAt });
};

const verifyOtpCode = async ({ email, purpose, otp }) => {
  const record = await OtpModel.findOne({ email, purpose }).sort({ createdAt: -1 });
  if (!record) {
    return { ok: false, message: 'OTP expired or not found' };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await record.deleteOne();
    return { ok: false, message: 'OTP expired' };
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await record.deleteOne();
    return { ok: false, message: 'Too many invalid attempts. Request a new OTP.' };
  }

  const isMatch = record.codeHash === hashOtp(otp);
  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    return { ok: false, message: 'Invalid OTP' };
  }

  await record.deleteOne();
  return { ok: true };
};

const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).required(),
  passwordConfirm: Joi.string().min(6).required(),
});

// ============ REGISTER NEW VOTER
// POST: api/voters/register
// UNPROTECTED
const registerVoter = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      passwordConfirm,
      confirmPassword,
      password2,
    } = req.body || {};
    const resolvedPasswordConfirm = passwordConfirm || confirmPassword || password2;

    const { error, value } = registerSchema.validate({
      firstName,
      lastName,
      email,
      password,
      passwordConfirm: resolvedPasswordConfirm,
    });

    if (error) {
      return next(new HttpError(error.details[0]?.message || 'Invalid input', 422));
    }

    if (value.password !== value.passwordConfirm) {
      return next(new HttpError('Passwords do not match', 422));
    }

    const normalizedEmail = value.email.toLowerCase();
    const existingVoter = await VoterModel.findOne({ email: normalizedEmail }).select('+password');

    const hashedPassword = await hashPassword(value.password);
    const adminFlag = isAdminEmail(normalizedEmail);

    if (existingVoter) {
      if (existingVoter.isVerified) {
        return next(new HttpError('Voter with this email already exists', 422));
      }

      existingVoter.firstName = value.firstName;
      existingVoter.lastName = value.lastName;
      existingVoter.password = hashedPassword;
      existingVoter.isAdmin = adminFlag;
      existingVoter.isVerified = false;
      await existingVoter.save();

      const otpDelivered = await createAndSendOtp({
        email: normalizedEmail,
        purpose: 'register',
      });

      if (!otpDelivered) {
        return res.status(200).json({
          message: 'OTP generated but delivery failed. Check server logs.',
          requiresOtp: true,
          otpPurpose: 'register',
          email: normalizedEmail,
        });
      }

      return res.status(200).json({
        message: 'OTP sent for verification',
        requiresOtp: true,
        otpPurpose: 'register',
        email: normalizedEmail,
      });
    }

    await VoterModel.create({
      firstName: value.firstName,
      lastName: value.lastName,
      email: normalizedEmail,
      password: hashedPassword,
      isAdmin: adminFlag,
      isVerified: false,
    });

    const otpDelivered = await createAndSendOtp({
      email: normalizedEmail,
      purpose: 'register',
    });

    if (!otpDelivered) {
      return res.status(201).json({
        message: 'OTP generated but delivery failed. Check server logs.',
        requiresOtp: true,
        otpPurpose: 'register',
        email: normalizedEmail,
      });
    }

    return res.status(201).json({
      message: 'OTP sent for verification',
      requiresOtp: true,
      otpPurpose: 'register',
      email: normalizedEmail,
    });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.email) {
      return next(new HttpError('Voter with this email already exists', 422));
    }
    return next(new HttpError(error.message || 'Failed to register voter', 500));
  }
};

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

const profileUpdateSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).optional(),
  lastName: Joi.string().trim().min(2).max(50).optional(),
}).min(1);

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
  passwordConfirm: Joi.string().min(6).required(),
});

// ============ LOGIN VOTER
// POST: api/voters/login
// UNPROTECTED
const loginVoter = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const { error, value } = loginSchema.validate({ email, password });
    if (error) {
      return next(new HttpError(error.details[0]?.message || 'Invalid input', 422));
    }

    const normalizedEmail = value.email.toLowerCase();
    const voter = await VoterModel.findOne({ email: normalizedEmail }).select('+password');

    if (!voter) {
      return next(new HttpError('Invalid email or password', 422));
    }

    const isValidPassword = await bcrypt.compare(value.password, voter.password);
    if (!isValidPassword) {
      return next(new HttpError('Invalid email or password', 422));
    }

    if (!voter.isVerified) {
      await createAndSendOtp({ email: normalizedEmail, purpose: 'register' });
      return res.status(200).json({
        message: 'Account not verified. OTP sent.',
        requiresOtp: true,
        otpPurpose: 'register',
        email: normalizedEmail,
      });
    }

    const otpDelivered = await createAndSendOtp({
      email: normalizedEmail,
      purpose: 'login',
    });

    if (!otpDelivered) {
      return res.status(200).json({
        message: 'OTP generated but delivery failed. Check server logs.',
        requiresOtp: true,
        otpPurpose: 'login',
        email: normalizedEmail,
      });
    }

    return res.status(200).json({
      message: 'OTP sent to your email.',
      requiresOtp: true,
      otpPurpose: 'login',
      email: normalizedEmail,
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Login failed', 500));
  }
};

// ============ REQUEST OTP
// POST: api/voters/request-otp
// UNPROTECTED
const requestOtp = async (req, res, next) => {
  try {
    const { email, purpose } = req.body || {};
    if (typeof email !== 'string' || typeof purpose !== 'string') {
      return next(new HttpError('Email and purpose are required', 422));
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!['register', 'reset', 'login'].includes(purpose)) {
      return next(new HttpError('Invalid OTP purpose', 422));
    }

    const voter = await VoterModel.findOne({ email: normalizedEmail });

    if (purpose === 'register') {
      if (!voter) {
        return next(new HttpError('Voter not found', 404));
      }
      if (voter.isVerified) {
        return next(new HttpError('Account already verified', 400));
      }
    }

    if (purpose === 'login') {
      if (!voter) {
        return res.status(200).json({
          message: 'If the account exists, an OTP has been sent.',
        });
      }
      if (!voter.isVerified) {
        return next(new HttpError('Account not verified', 403));
      }
    }

    if (purpose === 'reset' && !voter) {
      return res.status(200).json({
        message: 'If the account exists, an OTP has been sent.',
      });
    }

    await createAndSendOtp({ email: normalizedEmail, purpose });

    return res.status(200).json({
      message: 'OTP sent.',
      requiresOtp: true,
      otpPurpose: purpose,
      email: normalizedEmail,
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to send OTP', 500));
  }
};

// ============ VERIFY OTP
// POST: api/voters/verify-otp
// UNPROTECTED
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, purpose } = req.body || {};
    if (
      typeof email !== 'string' ||
      typeof otp !== 'string' ||
      typeof purpose !== 'string'
    ) {
      return next(new HttpError('Email, OTP, and purpose are required', 422));
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !otp.trim()) {
      return next(new HttpError('Email and OTP are required', 422));
    }

    if (!['register', 'login'].includes(purpose)) {
      return next(new HttpError('Invalid OTP purpose', 422));
    }

    const result = await verifyOtpCode({
      email: normalizedEmail,
      purpose,
      otp: otp.trim(),
    });

    if (!result.ok) {
      return next(new HttpError(result.message, 422));
    }

    const voter = await VoterModel.findOne({ email: normalizedEmail });
    if (!voter) {
      return next(new HttpError('Voter not found', 404));
    }

    if (purpose === 'register') {
      if (!voter.isVerified) {
        voter.isVerified = true;
        await voter.save();
      }

      return res.status(200).json({
        message: 'Account verified successfully',
        verified: true,
      });
    }

    if (!voter.isVerified) {
      return next(new HttpError('Account not verified', 403));
    }

    await issueAuthSession(voter, res);
    const voterPayload = formatVoterResponse(voter);

    return res.status(200).json({
      message: 'Login successful',
      id: voterPayload.id,
      isAdmin: voterPayload.isAdmin,
      firstName: voterPayload.firstName,
      lastName: voterPayload.lastName,
      email: voterPayload.email,
      votedElections: voterPayload.votedElections,
      voter: voterPayload,
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to verify OTP', 500));
  }
};

// ============ RESET PASSWORD
// POST: api/voters/reset-password
// UNPROTECTED
const resetPassword = async (req, res, next) => {
  try {
    const {
      email,
      otp,
      password,
      passwordConfirm,
      confirmPassword,
    } = req.body || {};

    if (
      typeof email !== 'string' ||
      typeof otp !== 'string' ||
      typeof password !== 'string'
    ) {
      return next(new HttpError('Email, OTP, and password are required', 422));
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !otp.trim() || !password.trim()) {
      return next(new HttpError('Email, OTP, and password are required', 422));
    }

    const resolvedPasswordConfirm = passwordConfirm || confirmPassword;
    if (typeof resolvedPasswordConfirm !== 'string') {
      return next(new HttpError('Password confirmation is required', 422));
    }

    if (password.trim().length < 6) {
      return next(new HttpError('Password must be at least 6 characters long', 422));
    }

    if (password !== resolvedPasswordConfirm) {
      return next(new HttpError('Passwords do not match', 422));
    }

    const otpResult = await verifyOtpCode({
      email: normalizedEmail,
      purpose: 'reset',
      otp: otp.trim(),
    });

    if (!otpResult.ok) {
      return next(new HttpError(otpResult.message, 422));
    }

    const voter = await VoterModel.findOne({ email: normalizedEmail }).select('+password');
    if (!voter) {
      return next(new HttpError('Voter not found', 404));
    }

    voter.password = await hashPassword(password);
    await voter.save();
    await VoterModel.findByIdAndUpdate(voter._id, {
      $unset: {
        refreshTokenHash: '',
        refreshTokenExpiresAt: '',
        refreshTokenCreatedAt: '',
      },
    });
    clearAuthCookies(res);

    return res.status(200).json({
      message: 'Password reset successful',
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to reset password', 500));
  }
};

// ============ Get VOTER
// GET: api/voters/id
// PROTECTED
const getVoter = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return next(new HttpError('Voter ID is required', 422));
    }

    if (!mongoose.isValidObjectId(id)) {
      return next(new HttpError('Invalid voter ID', 422));
    }

    if (req.user?.id !== id && !req.user?.isAdmin) {
      return next(new HttpError('Forbidden', 403));
    }

    const voter = await VoterModel.findById(id);
    if (!voter) {
      return next(new HttpError('Voter not found', 404));
    }

    return res.status(200).json({
      voter: formatVoterResponse(voter),
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to retrieve voter', 500));
  }
};

// ============ Get current voter
// GET: api/voters/me
// PROTECTED
const getMe = async (req, res, next) => {
  try {
    const voterId = req.user?.id;
    if (!voterId || !mongoose.isValidObjectId(voterId)) {
      return next(new HttpError('Unauthorized', 401));
    }

    const voter = await VoterModel.findById(voterId);
    if (!voter) {
      return next(new HttpError('Voter not found', 404));
    }

    return res.status(200).json({
      voter: formatVoterResponse(voter),
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to retrieve voter', 500));
  }
};

// ============ Update current voter profile
// PATCH: api/voters/me
// PROTECTED
const updateMe = async (req, res, next) => {
  try {
    const voterId = req.user?.id;
    if (!voterId || !mongoose.isValidObjectId(voterId)) {
      return next(new HttpError('Unauthorized', 401));
    }

    const { error, value } = profileUpdateSchema.validate(req.body || {});
    if (error) {
      return next(new HttpError(error.details[0]?.message || 'Invalid input', 422));
    }

    const updates = {};
    if (value.firstName) updates.firstName = value.firstName.trim();
    if (value.lastName) updates.lastName = value.lastName.trim();

    const voter = await VoterModel.findByIdAndUpdate(voterId, updates, {
      new: true,
    });
    if (!voter) {
      return next(new HttpError('Voter not found', 404));
    }

    return res.status(200).json({
      message: 'Profile updated successfully',
      voter: formatVoterResponse(voter),
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to update profile', 500));
  }
};

// ============ Change password
// POST: api/voters/change-password
// PROTECTED
const changePassword = async (req, res, next) => {
  try {
    const voterId = req.user?.id;
    if (!voterId || !mongoose.isValidObjectId(voterId)) {
      return next(new HttpError('Unauthorized', 401));
    }

    const { currentPassword, newPassword, passwordConfirm, confirmPassword } =
      req.body || {};
    const resolvedPasswordConfirm = passwordConfirm || confirmPassword;

    const { error, value } = changePasswordSchema.validate({
      currentPassword,
      newPassword,
      passwordConfirm: resolvedPasswordConfirm,
    });
    if (error) {
      return next(new HttpError(error.details[0]?.message || 'Invalid input', 422));
    }

    if (value.newPassword !== value.passwordConfirm) {
      return next(new HttpError('Passwords do not match', 422));
    }

    if (value.currentPassword === value.newPassword) {
      return next(new HttpError('New password must be different', 422));
    }

    const voter = await VoterModel.findById(voterId).select('+password');
    if (!voter) {
      return next(new HttpError('Voter not found', 404));
    }

    const isValidPassword = await bcrypt.compare(value.currentPassword, voter.password);
    if (!isValidPassword) {
      return next(new HttpError('Current password is incorrect', 422));
    }

    voter.password = await hashPassword(value.newPassword);
    await voter.save();

    await VoterModel.findByIdAndUpdate(voterId, {
      $unset: {
        refreshTokenHash: '',
        refreshTokenExpiresAt: '',
        refreshTokenCreatedAt: '',
      },
    });
    clearAuthCookies(res);

    return res.status(200).json({
      message: 'Password updated. Please sign in again.',
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to update password', 500));
  }
};

// ============ REFRESH SESSION
// POST: api/voters/refresh
// UNPROTECTED (uses refresh cookie)
const refreshSession = async (req, res, next) => {
  try {
    const refreshToken = getCookieValue(req, REFRESH_COOKIE_NAME);
    if (!refreshToken) {
      clearAuthCookies(res);
      return next(new HttpError('Unauthorized - Missing refresh token', 401));
    }

    const voter = await VoterModel.findOne({ refreshTokenHash: hashToken(refreshToken) })
      .select(
        '+refreshTokenHash +refreshTokenExpiresAt email firstName lastName isAdmin isVerified'
      )
      .lean();

    if (!voter || !refreshTokenMatches(voter.refreshTokenHash, refreshToken)) {
      clearAuthCookies(res);
      return next(new HttpError('Unauthorized - Invalid refresh token', 401));
    }

    if (!voter.refreshTokenExpiresAt || voter.refreshTokenExpiresAt.getTime() < Date.now()) {
      clearAuthCookies(res);
      await VoterModel.findByIdAndUpdate(voter._id, {
        $unset: {
          refreshTokenHash: '',
          refreshTokenExpiresAt: '',
          refreshTokenCreatedAt: '',
        },
      });
      return next(new HttpError('Unauthorized - Refresh token expired', 401));
    }

    if (!voter.isVerified) {
      clearAuthCookies(res);
      return next(new HttpError('Forbidden - Account not verified', 403));
    }

    await issueAuthSession(voter, res);
    const voterPayload = formatVoterResponse(voter);

    return res.status(200).json({
      message: 'Session refreshed',
      voter: voterPayload,
    });
  } catch (error) {
    clearAuthCookies(res);
    return next(new HttpError(error.message || 'Failed to refresh session', 500));
  }
};

// ============ LOGOUT VOTER
// POST: api/voters/logout
// UNPROTECTED (clears cookies)
const logoutVoter = async (req, res, next) => {
  try {
    const refreshToken = getCookieValue(req, REFRESH_COOKIE_NAME);
    let voterId = req.user?.id || null;

    if (!voterId && refreshToken) {
      const existing = await VoterModel.findOne({
        refreshTokenHash: hashToken(refreshToken),
      }).select('_id');
      if (existing?._id) {
        voterId = existing._id;
      }
    }

    if (voterId) {
      await VoterModel.findByIdAndUpdate(voterId, {
        $unset: {
          refreshTokenHash: '',
          refreshTokenExpiresAt: '',
          refreshTokenCreatedAt: '',
        },
      });
    }

    clearAuthCookies(res);
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    clearAuthCookies(res);
    return next(new HttpError(error.message || 'Failed to log out', 500));
  }
};

module.exports = {
  registerVoter,
  loginVoter,
  requestOtp,
  verifyOtp,
  resetPassword,
  getVoter,
  getMe,
  updateMe,
  changePassword,
  refreshSession,
  logoutVoter,
};
