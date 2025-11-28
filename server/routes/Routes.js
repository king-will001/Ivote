const {Router} = require('express');
const {registerVoter, loginVoter, getVoter} = require('../controllers/voterController')


const router = Router();


router.post('/voters/register', registerVoter);
router.post('/voters/login', loginVoter);
router.post('/voters/:id', getVoter);


module.exports = router;