const bcrypt = require("bcryptjs");
const VoterModel = require("../models/voterModel");
const OtpModel = require("../models/OtpModel");
const HttpError = require("../models/ErrorModel");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { sendOtpEmail } = require("../utils/email");
const {
  generateOtpCode,
  hashOtp,
  OTP_TTL_MINUTES,
  OTP_MAX_ATTEMPTS,
} = require("../utils/otp");

// =====================================
// REGISTER NEW VOTER
// Route: POST /api/voters/register
// Access: Public (No authentication required)
// =====================================
const registerVoter = async (req, res, next) => {
  try {
    const hasBody =
      req.body &&
      typeof req.body === "object" &&
      !Array.isArray(req.body) &&
      Object.keys(req.body).length > 0;

    const hasQuery =
      req.query &&
      typeof req.query === "object" &&
      !Array.isArray(req.query) &&
      Object.keys(req.query).length > 0;

    const input = hasBody ? req.body : hasQuery ? req.query : null;

    if (!input) {
      return next(
        new HttpError(
          "Missing request data. Send JSON with Content-Type: application/json",
          400
        )
      );
    }

    // 1. Extract fields from the request body (or query string as a fallback)
    const {
      firstName,
      lastName,
      email,
      password,
      passwordConfirm,
      confirmPassword,
      resolvedPasswordConfirm: resolvedPasswordConfirmFromClient,
    } = input;
    const resolvedPasswordConfirm =
      passwordConfirm ?? confirmPassword ?? resolvedPasswordConfirmFromClient;

    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof resolvedPasswordConfirm !== "string"
    ) {
      return next(new HttpError("Invalid input types", 422));
    }

    // 2. Validate that all fields are provided
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !resolvedPasswordConfirm
    ) {
      return next(new HttpError("Please provide all required fields", 422));
    }

    // 3. Normalize email to lowercase
    const normalizedEmail = email.trim().toLowerCase();

    // 4. Check if a voter already exists with this email
    const existingVoter = await VoterModel.findOne({ email: normalizedEmail });
    if (existingVoter && existingVoter.isVerified) {
      return next(new HttpError("Voter with this email already exists", 422));
    }

    // 5. Ensure passwords match
    if (password !== resolvedPasswordConfirm) {
      return next(new HttpError("Passwords do not match", 422));
    }

    // 6. Ensure password meets length requirements
    if (password.trim().length < 6) {
      return next(new HttpError("Password must be at least 6 characters long", 422));
    }

    // 7. Hash the password using bcrypt
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 8. Determine if the user should be an admin
    const isAdmin = normalizedEmail === "nbanmbosehprincewill@gmail.com";

    if (existingVoter) {
      existingVoter.firstName = firstName;
      existingVoter.lastName = lastName;
      existingVoter.password = hashedPassword;
      existingVoter.isAdmin = isAdmin;
      existingVoter.isVerified = true;
      await existingVoter.save();

      return res.status(200).json({
        message: "Account updated and verified.",
        verified: true,
        email: normalizedEmail,
      });
    }

    // 9. Create the new voter in the database
    await VoterModel.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      isAdmin,
      isVerified: true,
    });

    // 10. Skip OTP for development (auto-verify)
    return res.status(201).json({
      message: "Registration successful. Account verified.",
      verified: true,
      email: normalizedEmail,
    });
  } catch (error) {
    console.log("REGISTRATION ERROR:", error);

    if (error?.code === 11000 && error?.keyPattern?.email) {
      return next(new HttpError("Voter with this email already exists", 422));
    }

    if (error?.name === "ValidationError") {
      return next(new HttpError(error.message, 422));
    }

    if (error?.message === "Email service not configured") {
      return next(new HttpError("Email service not configured", 500));
    }

    const message =
      process.env.NODE_ENV === "production"
        ? "Registration failed, please try again"
        : `Registration failed: ${error.message}`;

    return next(new HttpError(message, 500));
  }
};



// Function to generate token 
const generateToken = (payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1d",
  })
  return token;
}

const createAndSendOtp = async ({ email, purpose }) => {
  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await OtpModel.deleteMany({ email, purpose });
  await OtpModel.create({
    email,
    purpose,
    codeHash: hashOtp(otpCode),
    expiresAt,
  });

  await sendOtpEmail({
    to: email,
    code: otpCode,
    purpose,
    expiresAt,
  });
};

const verifyOtpCode = async ({ email, purpose, otp }) => {
  const record = await OtpModel.findOne({ email, purpose }).sort({ createdAt: -1 });

  if (!record) {
    return { ok: false, message: "OTP expired or not found" };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await record.deleteOne();
    return { ok: false, message: "OTP expired" };
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await record.deleteOne();
    return { ok: false, message: "Too many invalid attempts. Request a new OTP." };
  }

  const isMatch = record.codeHash === hashOtp(otp);
  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    return { ok: false, message: "Invalid OTP" };
  }

  await record.deleteOne();
  return { ok: true };
};

// ============ REQUEST OTP
// POST: api/voters/request-otp
// UNPROTECTED
const requestOtp = async (req, res, next) => {
  try {
    const { email, purpose } = req.body || {};

    if (typeof email !== "string" || typeof purpose !== "string") {
      return next(new HttpError("Email and purpose are required", 422));
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return next(new HttpError("Email is required", 422));
    }

    if (!["register", "reset"].includes(purpose)) {
      return next(new HttpError("Invalid OTP purpose", 422));
    }

    const voter = await VoterModel.findOne({ email: normalizedEmail });

    if (purpose === "register") {
      if (!voter) {
        return next(new HttpError("Voter not found", 404));
      }
      if (voter.isVerified) {
        return next(new HttpError("Account already verified", 400));
      }
    }

    if (purpose === "reset" && !voter) {
      return res.status(200).json({
        message: "If the account exists, an OTP has been sent.",
      });
    }

    await createAndSendOtp({ email: normalizedEmail, purpose });

    return res.status(200).json({
      message: "OTP sent.",
      requiresOtp: true,
      otpPurpose: purpose,
      email: normalizedEmail,
    });
  } catch (error) {
    console.log("REQUEST OTP ERROR:", error);
    if (error?.message === "Email service not configured") {
      return next(new HttpError("Email service not configured", 500));
    }
    return next(new HttpError("Failed to send OTP", 500));
  }
};

// ============ VERIFY OTP
// POST: api/voters/verify-otp
// UNPROTECTED
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, purpose } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof otp !== "string" ||
      typeof purpose !== "string"
    ) {
      return next(new HttpError("Email, OTP, and purpose are required", 422));
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !otp.trim()) {
      return next(new HttpError("Email and OTP are required", 422));
    }

    if (!["register", "login"].includes(purpose)) {
      return next(new HttpError("Invalid OTP purpose", 422));
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
      return next(new HttpError("Voter not found", 404));
    }

    if (purpose === "register") {
      if (!voter.isVerified) {
        voter.isVerified = true;
        await voter.save();
      }

      return res.status(200).json({
        message: "Account verified successfully",
        verified: true,
      });
    }

    if (!voter.isVerified) {
      return next(new HttpError("Account not verified", 403));
    }

    const { _id: id, votedElections, isAdmin, firstName, lastName } = voter;
    const token = generateToken({
      id,
      email: normalizedEmail,
      isAdmin,
      firstName,
      lastName,
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      id,
      isAdmin,
      firstName,
      lastName,
      votedElections,
      voter: {
        id,
        firstName,
        lastName,
        email: voter.email,
        isAdmin,
        votedElections,
      },
    });
  } catch (error) {
    console.log("VERIFY OTP ERROR:", error);
    return next(new HttpError("Failed to verify OTP", 500));
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
      typeof email !== "string" ||
      typeof otp !== "string" ||
      typeof password !== "string"
    ) {
      return next(new HttpError("Email, OTP, and password are required", 422));
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !otp.trim() || !password.trim()) {
      return next(new HttpError("Email, OTP, and password are required", 422));
    }

    const resolvedPasswordConfirm = passwordConfirm ?? confirmPassword;
    if (typeof resolvedPasswordConfirm !== "string") {
      return next(new HttpError("Password confirmation is required", 422));
    }

    if (password.trim().length < 6) {
      return next(new HttpError("Password must be at least 6 characters long", 422));
    }

    if (password !== resolvedPasswordConfirm) {
      return next(new HttpError("Passwords do not match", 422));
    }

    const otpResult = await verifyOtpCode({
      email: normalizedEmail,
      purpose: "reset",
      otp: otp.trim(),
    });

    if (!otpResult.ok) {
      return next(new HttpError(otpResult.message, 422));
    }

    const voter = await VoterModel.findOne({ email: normalizedEmail });
    if (!voter) {
      return next(new HttpError("Voter not found", 404));
    }

    const salt = await bcrypt.genSalt(12);
    voter.password = await bcrypt.hash(password, salt);
    await voter.save();

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.log("RESET PASSWORD ERROR:", error);
    return next(new HttpError("Failed to reset password", 500));
  }
};


// ============ LOGIN VOTER
// POST: api/voters/login
//UNPROTECTED
const loginVoter = async (req, res, next) => {
    try {
        const body = req.body;
        const query = req.query;

        const hasBody =
          body &&
          typeof body === "object" &&
          !Array.isArray(body) &&
          Object.keys(body).length > 0;

        const hasQuery =
          query &&
          typeof query === "object" &&
          !Array.isArray(query) &&
          Object.keys(query).length > 0;

        const input = hasBody ? body : hasQuery ? query : null;
        const cameFromQuery = !hasBody && hasQuery;

        if (!input) {
          return next(
            new HttpError(
              "Missing request data. Send JSON with Content-Type: application/json",
              400
            )
          );
        }

        if (cameFromQuery) {
          return next(
            new HttpError(
              "Do not send login credentials in the URL. Use POST /api/voters/login with a JSON body.",
              400
            )
          );
        }

        const { email, password } = input;

        if (email == null || password == null) {
            return next(new HttpError("Please provide email and password", 422));
        }

        if (typeof email !== "string" || typeof password !== "string") {
            return next(new HttpError("Invalid input types", 422));
        }

        if (!email.trim() || !password.trim()) {
            return next(new HttpError("Please provide email and password", 422));
        }

        const normalizedEmail = email.trim().toLowerCase();
        const voter = await VoterModel.findOne({ email: normalizedEmail });

        if (!voter) {
            return next(new HttpError("Voter not found", 404));
        }

        const isValidPassword = await bcrypt.compare(password, voter.password);
        if (!isValidPassword) {
            return next(new HttpError("Invalid email or password", 422));
        }

        if (!voter.isVerified) {
          await createAndSendOtp({ email: normalizedEmail, purpose: "register" });
          return res.status(200).json({
            message: "Account not verified. OTP sent.",
            requiresOtp: true,
            otpPurpose: "register",
            email: normalizedEmail,
          });
        }

        await createAndSendOtp({ email: normalizedEmail, purpose: "login" });
        return res.status(200).json({
          message: "OTP sent to your email.",
          requiresOtp: true,
          otpPurpose: "login",
          email: normalizedEmail,
        });
  } catch (error) {
        console.log("LOGIN ERROR:", error);

        if (error?.message === "Email service not configured") {
            return next(new HttpError("Email service not configured", 500));
        }

        const message =
          process.env.NODE_ENV === "production"
            ? "Login failed, please try again"
            : `Login failed: ${error.message}`;

        return next(new HttpError(message, 500));
    }
}




// ============ Get VOTER 
// GET: api/voters/id
//PROTECTED
const getVoter = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return next(new HttpError("Voter ID is required", 422));
        }

        if (!mongoose.isValidObjectId(id)) {
            return next(new HttpError("Invalid voter ID", 422));
        }

        const voter = await VoterModel.findById(id);
        
        if (!voter) {
            return next(new HttpError("Voter not found", 404));
        }

        return res.status(200).json({
            voter: {
                id: voter._id,
                firstName: voter.firstName,
                lastName: voter.lastName,
                email: voter.email,
                isAdmin: voter.isAdmin,
                votedElections: voter.votedElections,
            },
        });
    } catch (error) {
        console.log("GET VOTER ERROR:", error);

        if (error?.name === "CastError") {
            return next(new HttpError("Invalid voter ID", 422));
        }

        return next(new HttpError("Failed to retrieve voter", 500));
    }
}





module.exports = {
    registerVoter,
    loginVoter,
    getVoter,
    requestOtp,
    verifyOtp,
    resetPassword,
}
