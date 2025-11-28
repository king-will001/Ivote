
// ============ REGISTER NEW VOTER
// POST: api/voters/register
//UNPROTECTED
const registerVoter = (req, res, next) => {
    res.json("Register voter")
}


// ============ LOGIN VOTER
// POST: api/voters/login
//UNPROTECTED
const loginVoter = (req, res, next) => {
    res.json("login voter")
}

// ============ Get VOTER 
// POST: api/voters/id
//PROTECTED
const getVoter = (req, res, next) => {
    res.json("get voter")
}





module.exports = {
    registerVoter, loginVoter, getVoter
}