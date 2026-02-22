const mongoose = require('mongoose');
const Joi = require('joi');
const ElectionModel = require('../models/electionModel');
const CandidateModel = require('../models/CandidateModel');
const VoteModel = require('../models/VoteModel');
const VoterModel = require('../models/voterModel');
const HttpError = require('../models/ErrorModal');

const voteSchema = Joi.object({
  candidateId: Joi.string().required(),
});

// ============ CAST VOTE
// POST: api/elections/:id/votes
// PROTECTED
const castVote = async (req, res, next) => {
  try {
    const { id: electionId } = req.params;
    const { candidateId } = req.body || {};

    const { error } = voteSchema.validate({ candidateId });
    if (error) {
      return next(new HttpError(error.details[0]?.message || 'Invalid input', 422));
    }

    if (!mongoose.isValidObjectId(electionId)) {
      return next(new HttpError('Invalid election ID', 422));
    }
    if (!mongoose.isValidObjectId(candidateId)) {
      return next(new HttpError('Invalid candidate ID', 422));
    }

    const resolvedVoterId = req.user?.id;
    if (!resolvedVoterId || !mongoose.isValidObjectId(resolvedVoterId)) {
      return next(new HttpError('Invalid voter ID', 422));
    }

    const executeVote = async (session) => {
      const withSession = (query) => (session ? query.session(session) : query);

      const [election, candidate, voter] = await Promise.all([
        withSession(ElectionModel.findById(electionId)),
        withSession(CandidateModel.findById(candidateId)),
        withSession(VoterModel.findById(resolvedVoterId)),
      ]);

      if (!election) {
        throw new HttpError('Election not found', 404);
      }
      if (!candidate) {
        throw new HttpError('Candidate not found', 404);
      }
      if (!voter) {
        throw new HttpError('Voter not found', 404);
      }
      if (!voter.isVerified) {
        throw new HttpError('Account not verified', 403);
      }

      if (String(candidate.election) !== String(electionId)) {
        throw new HttpError('Candidate does not belong to this election', 422);
      }

      if (election.isActive === false) {
        throw new HttpError('Election is not active.', 403);
      }

      if (election.startTime && election.endTime) {
        const now = Date.now();
        const start = new Date(election.startTime).getTime();
        const end = new Date(election.endTime).getTime();
        if (!Number.isNaN(start) && now < start) {
          throw new HttpError('Voting has not started yet.', 403);
        }
        if (!Number.isNaN(end) && now > end) {
          throw new HttpError('Voting has ended.', 403);
        }
      }

      const existingVote = await withSession(
        VoteModel.findOne({ election: electionId, voter: resolvedVoterId })
      );
      if (existingVote) {
        throw new HttpError('You have already voted in this election.', 409);
      }

      const [vote] = await VoteModel.create(
        [
          {
            election: electionId,
            candidate: candidateId,
            voter: resolvedVoterId,
          },
        ],
        session ? { session } : undefined
      );

      const [updatedCandidate] = await Promise.all([
        CandidateModel.findByIdAndUpdate(
          candidateId,
          { $inc: { votesCount: 1 } },
          { new: true, ...(session ? { session } : {}) }
        ),
        ElectionModel.findByIdAndUpdate(
          electionId,
          {
            $addToSet: { voters: resolvedVoterId },
            $inc: { totalVotes: 1 },
          },
          session ? { session } : undefined
        ),
        VoterModel.findByIdAndUpdate(
          resolvedVoterId,
          { $addToSet: { votedElections: electionId } },
          session ? { session } : undefined
        ),
      ]);

      return { vote, updatedCandidate };
    };

    let result;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        result = await executeVote(session);
      });
    } catch (error) {
      if (
        error instanceof HttpError ||
        (typeof error?.code === 'number' && error.code < 600)
      ) {
        return next(error);
      }
      const message = String(error?.message || '');
      if (
        process.env.NODE_ENV !== 'production' &&
        message.includes('Transaction numbers are only allowed on a replica set')
      ) {
        result = await executeVote(null);
      } else if (error?.code === 11000) {
        return next(new HttpError('You have already voted in this election.', 409));
      } else {
        throw error;
      }
    } finally {
      session.endSession();
    }

    return res.status(201).json({
      message: 'Vote cast successfully',
      vote: result.vote,
      candidate: result.updatedCandidate,
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to cast vote', 500));
  }
};

module.exports = { castVote };
