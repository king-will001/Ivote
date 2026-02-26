// Add to your auth middleware
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

// Implement token expiration
const token = jwt.sign(
  { userId, isAdmin },
  process.env.JWT_SECRET,
  { expiresIn: '2h' }  // Add this
);