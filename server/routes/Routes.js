const { Router } = require('express');
const { body, param } = require('express-validator');
const {
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
} = require('../controllers/voterController');
const {
  addElection,
  getAllElections,
  getElection,
  updateElection,
  deleteElection,
  getElectionCandidates,
  addElectionCandidate,
  deleteElectionCandidate,
  getElectionVoters,
} = require('../controllers/electionController');
const { castVote } = require('../controllers/voteController');
const {
  getNews,
  getNewsById,
  createNews,
  deleteNews,
} = require('../controllers/newsController');
const {
  getDashboardStats,
  getElectionStats,
  getLiveResults,
  getElectionTotalVotes,
} = require('../controllers/analyticsController');
const { getHealth } = require('../controllers/healthController');
const { verifyToken, verifyAdminToken, optionalAuth } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { authLimiter, otpLimiter, loginLimiter } = require('../middleware/rateLimiters');
const { getCsrfToken } = require('../middleware/csrfMiddleware');

const router = Router();

router.get('/health', getHealth);
router.get('/csrf', getCsrfToken);

router.post(
  '/voters/register',
  authLimiter,
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validateRequest,
  registerVoter
);
router.post(
  '/voters/login',
  loginLimiter,
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest,
  loginVoter
);
router.post(
  '/voters/request-otp',
  otpLimiter,
  body('email').isEmail().withMessage('Valid email is required'),
  body('purpose').notEmpty().withMessage('OTP purpose is required'),
  validateRequest,
  requestOtp
);
router.post(
  '/voters/verify-otp',
  otpLimiter,
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 4 }).withMessage('OTP is required'),
  body('purpose').notEmpty().withMessage('OTP purpose is required'),
  validateRequest,
  verifyOtp
);
router.post(
  '/voters/reset-password',
  otpLimiter,
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 4 }).withMessage('OTP is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validateRequest,
  resetPassword
);
router.post('/voters/refresh', authLimiter, refreshSession);
router.post('/voters/logout', optionalAuth, logoutVoter);
router.get('/voters/me', verifyToken, getMe);
router.patch('/voters/me', verifyToken, updateMe);
router.post('/voters/change-password', verifyToken, changePassword);
router.get(
  '/voters/:id',
  verifyToken,
  param('id').isMongoId().withMessage('Valid voter ID required'),
  validateRequest,
  getVoter
);

router.post('/elections', verifyAdminToken, addElection);
router.get('/elections', getAllElections);
router.get(
  '/elections/:id',
  param('id').isMongoId().withMessage('Valid election ID required'),
  validateRequest,
  getElection
);
router.patch(
  '/elections/:id',
  verifyAdminToken,
  param('id').isMongoId().withMessage('Valid election ID required'),
  validateRequest,
  updateElection
);
router.delete(
  '/elections/:id',
  verifyAdminToken,
  param('id').isMongoId().withMessage('Valid election ID required'),
  validateRequest,
  deleteElection
);
router.get(
  '/elections/:id/candidates',
  param('id').isMongoId().withMessage('Valid election ID required'),
  validateRequest,
  getElectionCandidates
);
router.post(
  '/elections/:id/candidates',
  verifyAdminToken,
  param('id').isMongoId().withMessage('Valid election ID required'),
  validateRequest,
  addElectionCandidate
);
router.delete(
  '/elections/:id/candidates/:candidateId',
  verifyAdminToken,
  param('id').isMongoId().withMessage('Valid election ID required'),
  param('candidateId').isMongoId().withMessage('Valid candidate ID required'),
  validateRequest,
  deleteElectionCandidate
);
router.post(
  '/elections/:id/votes',
  verifyToken,
  param('id').isMongoId().withMessage('Valid election ID required'),
  validateRequest,
  castVote
);
router.get(
  '/elections/:id/voters',
  verifyAdminToken,
  param('id').isMongoId().withMessage('Valid election ID required'),
  validateRequest,
  getElectionVoters
);

router.get('/news', getNews);
router.get(
  '/news/:id',
  param('id').isMongoId().withMessage('Valid news ID required'),
  validateRequest,
  getNewsById
);
router.post('/news', verifyAdminToken, createNews);
router.delete(
  '/news/:id',
  verifyAdminToken,
  param('id').isMongoId().withMessage('Valid news ID required'),
  validateRequest,
  deleteNews
);

router.get('/analytics/dashboard', verifyAdminToken, getDashboardStats);
router.get(
  '/analytics/elections/:id/stats',
  optionalAuth,
  param('id').isMongoId().withMessage('Valid election ID required'),
  validateRequest,
  getElectionStats
);
router.get(
  '/analytics/elections/:id/live-results',
  optionalAuth,
  param('id').isMongoId().withMessage('Valid election ID required'),
  validateRequest,
  getLiveResults
);
router.get(
  '/analytics/elections/:id/total-votes',
  param('id').isMongoId().withMessage('Valid election ID required'),
  validateRequest,
  getElectionTotalVotes
);

module.exports = router;
