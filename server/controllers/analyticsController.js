const ElectionModel = require('../models/electionModel');
const VoteModel = require('../models/VoteModel');
const CandidateModel = require('../models/CandidateModel');
const HttpError = require('../models/ErrorModel');
const jwt = require("jsonwebtoken");

const getAuthPayload = (req) => {
    const header = req.headers?.authorization || "";
    if (!header.startsWith("Bearer ")) {
        return null;
    }
    const token = header.slice(7).trim();
    if (!token) {
        return null;
    }
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

const requireAdmin = (req, next) => {
    const auth = getAuthPayload(req);
    if (!auth) {
        next(new HttpError("Unauthorized", 401));
        return false;
    }
    if (!auth.isAdmin) {
        next(new HttpError("Admin access required", 403));
        return false;
    }
    return true;
};

// GET: api/analytics/elections/:id/stats
// Get comprehensive statistics for an election
const getElectionStats = async (req, res, next) => {
    try {
        const { id } = req.params;

        const election = await ElectionModel.findById(id)
            .populate('candidates')
            .populate('voters');

        if (!election) {
            return next(new HttpError("Election not found", 404));
        }

        const votes = await VoteModel.find({ election: id })
            .populate('candidate')
            .populate('voter');

        const totalVotes = votes.length;
        const totalCandidates = election.candidates.length;
        const totalEligibleVoters = election.voters.length;
        const votePercentage = totalEligibleVoters > 0 
            ? ((totalVotes / totalEligibleVoters) * 100).toFixed(2) 
            : 0;

        // Vote counts by candidate
        const candidateStats = election.candidates.map(candidate => {
            const candidateVotes = votes.filter(v => v.candidate._id.toString() === candidate._id.toString());
            const voteCount = candidateVotes.length;
            const percentage = totalVotes > 0 
                ? ((voteCount / totalVotes) * 100).toFixed(2) 
                : 0;

            return {
                candidateId: candidate._id,
                candidateName: candidate.name,
                candidateImage: candidate.image,
                voteCount,
                percentage: parseFloat(percentage),
                trend: 'stable' // Can be enhanced with historical data
            };
        });

        // Sort by vote count (descending)
        candidateStats.sort((a, b) => b.voteCount - a.voteCount);

        // Election phase
        const now = new Date();
        const startTime = new Date(election.startTime);
        const endTime = new Date(election.endTime);
        let phase = 'unscheduled';
        
        if (now < startTime) phase = 'upcoming';
        else if (now >= startTime && now < endTime) phase = 'live';
        else if (now >= endTime) phase = 'closed';

        const stats = {
            electionId: election._id,
            electionTitle: election.title,
            phase,
            totalVotes,
            totalCandidates,
            totalEligibleVoters,
            votePercentage: parseFloat(votePercentage),
            candidates: candidateStats,
            startTime: election.startTime,
            endTime: election.endTime,
            isActive: election.isActive,
            createdAt: election.createdAt,
            updatedAt: election.updatedAt
        };

        return res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching election stats:', error);
        return next(new HttpError(error.message, 500));
    }
};

// GET: api/analytics/elections
// Get dashboard statistics for all elections
const getDashboardStats = async (req, res, next) => {
    try {
        if (!requireAdmin(req, next)) {
            return;
        }

        const elections = await ElectionModel.find()
            .populate('candidates')
            .populate('voters');

        const allVotes = await VoteModel.find();
        const totalVotesAllElections = allVotes.length;

        const electionStats = await Promise.all(
            elections.map(async (election) => {
                const votes = await VoteModel.find({ election: election._id });
                const totalVotes = votes.length;
                const totalEligibleVoters = election.voters.length;
                const votePercentage = totalEligibleVoters > 0 
                    ? ((totalVotes / totalEligibleVoters) * 100).toFixed(2) 
                    : 0;

                const now = new Date();
                const startTime = new Date(election.startTime);
                const endTime = new Date(election.endTime);
                let phase = 'unscheduled';
                
                if (now < startTime) phase = 'upcoming';
                else if (now >= startTime && now < endTime) phase = 'live';
                else if (now >= endTime) phase = 'closed';

                return {
                    electionId: election._id,
                    title: election.title,
                    phase,
                    totalVotes,
                    votePercentage: parseFloat(votePercentage),
                    totalCandidates: election.candidates.length,
                    totalEligibleVoters,
                    isActive: election.isActive
                };
            })
        );

        const totalElections = elections.length;
        const activeElections = electionStats.filter(e => e.phase === 'live').length;
        const upcomingElections = electionStats.filter(e => e.phase === 'upcoming').length;
        const closedElections = electionStats.filter(e => e.phase === 'closed').length;

        const stats = {
            summary: {
                totalElections,
                activeElections,
                upcomingElections,
                closedElections,
                totalVotes: totalVotesAllElections
            },
            elections: electionStats
        };

        return res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return next(new HttpError(error.message, 500));
    }
};

// GET: api/analytics/elections/:id/live-results
// Get live results for a specific election
const getLiveResults = async (req, res, next) => {
    try {
        const { id } = req.params;

        const election = await ElectionModel.findById(id)
            .populate('candidates');

        if (!election) {
            return next(new HttpError("Election not found", 404));
        }

        const votes = await VoteModel.find({ election: id })
            .populate('candidate');

        const totalVotes = votes.length;

        const results = election.candidates.map(candidate => {
            const candidateVotes = votes.filter(v => 
                v.candidate._id.toString() === candidate._id.toString()
            );
            const voteCount = candidateVotes.length;
            const percentage = totalVotes > 0 
                ? ((voteCount / totalVotes) * 100).toFixed(2) 
                : 0;

            return {
                candidateId: candidate._id,
                candidateName: candidate.name,
                candidateImage: candidate.image,
                voteCount,
                percentage: parseFloat(percentage)
            };
        });

        // Sort by vote count (descending)
        results.sort((a, b) => b.voteCount - a.voteCount);

        return res.status(200).json({
            success: true,
            data: {
                electionId: election._id,
                electionTitle: election.title,
                totalVotes,
                results,
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error('Error fetching live results:', error);
        return next(new HttpError(error.message, 500));
    }
};

module.exports = {
    getElectionStats,
    getDashboardStats,
    getLiveResults
};
