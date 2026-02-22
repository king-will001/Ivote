const mongoose = require('mongoose');
const ElectionModel = require('../models/electionModel');
const CandidateModel = require('../models/CandidateModel');
const VoteModel = require('../models/VoteModel');
const VoterModel = require('../models/voterModel');
const HttpError = require('../models/ErrorModal');
const { resolveImageOutput } = require('../utils/fileStorage');

const isElectionClosed = (election) => {
  if (!election?.endTime) return false;
  const endTime = new Date(election.endTime).getTime();
  if (Number.isNaN(endTime)) return false;
  return Date.now() >= endTime;
};

const resolveCandidateName = (candidate) =>
  candidate?.fullName ||
  [candidate?.firstName, candidate?.lastName].filter(Boolean).join(' ').trim();

const sumCandidateVotes = (candidates = []) =>
  candidates.reduce((sum, candidate) => sum + (Number(candidate?.votesCount) || 0), 0);

const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const [
      totalElections,
      totalCandidates,
      totalVoters,
      totalVotes,
      activeElections,
      upcomingElections,
      closedElections,
    ] = await Promise.all([
      ElectionModel.countDocuments(),
      CandidateModel.countDocuments(),
      VoterModel.countDocuments(),
      VoteModel.countDocuments(),
      ElectionModel.countDocuments({
        startTime: { $lte: now },
        endTime: { $gte: now },
      }),
      ElectionModel.countDocuments({ startTime: { $gt: now } }),
      ElectionModel.countDocuments({ endTime: { $lt: now } }),
    ]);

    return res.status(200).json({
      data: {
        totalElections,
        totalCandidates,
        totalVoters,
        totalVotes,
        activeElections,
        upcomingElections,
        closedElections,
      },
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to fetch dashboard stats', 500));
  }
};

const getElectionStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return next(new HttpError('Invalid election ID', 422));
    }

    const election = await ElectionModel.findById(id)
      .select('title endTime totalVotes')
      .lean();
    if (!election) {
      return next(new HttpError('Election not found', 404));
    }

    if (!isElectionClosed(election) && !req.user?.isAdmin) {
      return next(new HttpError('Results are available after the election ends.', 403));
    }

    const candidates = await CandidateModel.find({ election: id })
      .select('firstName lastName fullName image votesCount')
      .lean();
    const computedTotal = sumCandidateVotes(candidates);
    const storedTotal = Number.isFinite(election.totalVotes) ? election.totalVotes : null;
    const totalVotes = storedTotal === null ? computedTotal : storedTotal;
    if (storedTotal === null || storedTotal !== computedTotal) {
      await ElectionModel.findByIdAndUpdate(id, { $set: { totalVotes: computedTotal } });
    }
    const candidateStats = candidates.map((candidate) => {
      const voteCount = Number(candidate?.votesCount) || 0;
      const percentage = totalVotes ? (voteCount / totalVotes) * 100 : 0;
      return {
        candidateId: candidate._id,
        candidateName: resolveCandidateName(candidate),
        candidateImage: resolveImageOutput(candidate.image),
        voteCount,
        percentage: Number(percentage.toFixed(2)),
      };
    });

    return res.status(200).json({
      data: {
        electionId: id,
        title: election.title,
        totalVotes,
        candidates: candidateStats,
      },
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to fetch election stats', 500));
  }
};

const getLiveResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return next(new HttpError('Invalid election ID', 422));
    }

    const election = await ElectionModel.findById(id)
      .select('title endTime totalVotes')
      .lean();
    if (!election) {
      return next(new HttpError('Election not found', 404));
    }

    if (!isElectionClosed(election) && !req.user?.isAdmin) {
      return next(new HttpError('Results are available after the election ends.', 403));
    }

    const candidates = await CandidateModel.find({ election: id })
      .select('firstName lastName fullName image votesCount')
      .lean();
    const computedTotal = sumCandidateVotes(candidates);
    const storedTotal = Number.isFinite(election.totalVotes) ? election.totalVotes : null;
    const totalVotes = storedTotal === null ? computedTotal : storedTotal;
    if (storedTotal === null || storedTotal !== computedTotal) {
      await ElectionModel.findByIdAndUpdate(id, { $set: { totalVotes: computedTotal } });
    }

    const results = candidates
      .map((candidate) => {
        const voteCount = Number(candidate?.votesCount) || 0;
        const percentage = totalVotes ? (voteCount / totalVotes) * 100 : 0;
        return {
          candidateId: candidate._id,
          candidateName: resolveCandidateName(candidate),
          candidateImage: resolveImageOutput(candidate.image),
          voteCount,
          percentage: Number(percentage.toFixed(2)),
        };
      })
      .sort((a, b) => b.voteCount - a.voteCount);

    return res.status(200).json({
      data: {
        electionId: id,
        title: election.title,
        totalVotes,
        results,
      },
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to fetch live results', 500));
  }
};

const getElectionTotalVotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return next(new HttpError('Invalid election ID', 422));
    }

    const election = await ElectionModel.findById(id)
      .select('title totalVotes')
      .lean();
    if (!election) {
      return next(new HttpError('Election not found', 404));
    }

    let totalVotes = Number.isFinite(election.totalVotes) ? election.totalVotes : null;
    if (totalVotes === null) {
      const candidates = await CandidateModel.find({ election: id })
        .select('votesCount')
        .lean();
      totalVotes = sumCandidateVotes(candidates);
      await ElectionModel.findByIdAndUpdate(id, { $set: { totalVotes } });
    }

    return res.status(200).json({
      data: {
        electionId: id,
        title: election.title,
        totalVotes,
      },
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to fetch vote totals', 500));
  }
};

module.exports = {
  getDashboardStats,
  getElectionStats,
  getLiveResults,
  getElectionTotalVotes,
};
