const {Router} = require('express');
const {
  registerVoter,
  loginVoter,
  getVoter,
  requestOtp,
  verifyOtp,
  resetPassword,
} = require('../controllers/voterController')
const {
  addElection,
  getAllElections,
  getElection,
  updateElection,
  deleteElection,
  getElectionCandidates,
  getElectionVoters,
  addElectionCandidate
} = require('../controllers/electionController')
const { getNews, createNews, deleteNews } = require('../controllers/newsController')
const { castVote } = require('../controllers/voteController')
const { getElectionStats, getDashboardStats, getLiveResults } = require('../controllers/analyticsController')
const HttpError = require('../models/ErrorModel');
const { verifyToken, verifyAdminToken } = require('../middleware/authMiddleware');

const router = Router();


router.post('/voters/register', registerVoter);
router.post('/voters/login', loginVoter);
router.post('/voters/request-otp', requestOtp);
router.post('/voters/verify-otp', verifyOtp);
router.post('/voters/reset-password', resetPassword);
// Guard against accidentally calling login with GET (would otherwise match /voters/:id)
router.get('/voters/login', (req, res, next) =>
  next(new HttpError('Use POST /api/voters/login', 405))
);
router.get('/voters/:id', getVoter);

router.post('/elections', verifyAdminToken, addElection);
router.get('/elections', getAllElections);
router.get('/elections/:id', getElection);
router.patch('/elections/:id', verifyAdminToken, updateElection);
router.delete('/elections/:id', verifyAdminToken, deleteElection);
router.get('/elections/:id/candidates', getElectionCandidates);
router.post('/elections/:id/candidates', verifyAdminToken, addElectionCandidate);
router.post('/elections/:id/votes', verifyToken, castVote);
router.get('/elections/:id/voters', verifyAdminToken, getElectionVoters);

router.get('/news', getNews);
router.post('/news', createNews);
router.delete('/news/:id', deleteNews);

// Analytics routes
router.get('/analytics/dashboard', verifyAdminToken, getDashboardStats);
router.get('/analytics/elections/:id/stats', getElectionStats);
router.get('/analytics/elections/:id/live-results', getLiveResults);


module.exports = router;
