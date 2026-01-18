const mongoose = require("mongoose");
const ElectionModel = require("../models/electionModel");
const CandidateModel = require("../models/CandidateModel");
const VoterModel = require("../models/voterModel");
const VoteModel = require("../models/VoteModel");
const HttpError = require("../models/ErrorModel");

const castVote = async (req, res, next) => {
  try {
    const { id: electionId } = req.params;
    const { candidateId } = req.body || {};
    const voterId = req.user?.id || req.user?._id;

    if (!electionId || !candidateId) {
      return next(new HttpError("Election ID and candidate ID are required", 422));
    }

    if (!mongoose.isValidObjectId(electionId) || !mongoose.isValidObjectId(candidateId)) {
      return next(new HttpError("Invalid election or candidate ID", 422));
    }

    if (!voterId || !mongoose.isValidObjectId(voterId)) {
      return next(new HttpError("Unauthorized", 401));
    }

    const [election, candidate, voter] = await Promise.all([
      ElectionModel.findById(electionId),
      CandidateModel.findById(candidateId),
      VoterModel.findById(voterId),
    ]);

    if (!election) {
      return next(new HttpError("Election not found", 404));
    }

    if (!candidate) {
      return next(new HttpError("Candidate not found", 404));
    }

    if (!voter) {
      return next(new HttpError("Voter not found", 404));
    }

    if (String(candidate.election) !== String(electionId)) {
      return next(new HttpError("Candidate does not belong to this election", 422));
    }

    if (election.isActive === false) {
      return next(new HttpError("Election is not active", 422));
    }

    if (election.startTime && election.endTime) {
      const now = new Date();
      const start = new Date(election.startTime);
      const end = new Date(election.endTime);

      if (!Number.isNaN(start.getTime()) && now < start) {
        return next(new HttpError("Voting has not started yet", 422));
      }
      if (!Number.isNaN(end.getTime()) && now > end) {
        return next(new HttpError("Voting has ended", 422));
      }
    }

    const alreadyVoted = voter.votedElections?.some(
      (item) => String(item) === String(electionId)
    );
    if (alreadyVoted) {
      return next(new HttpError("You have already voted in this election.", 409));
    }

    const existingVote = await VoteModel.findOne({
      election: electionId,
      voter: voterId,
    });

    if (existingVote) {
      return next(new HttpError("You have already voted in this election.", 409));
    }

    const vote = await VoteModel.create({
      election: electionId,
      candidate: candidateId,
      voter: voterId,
    });

    const updatedCandidate = await CandidateModel.findByIdAndUpdate(
      candidateId,
      { $inc: { votesCount: 1 } },
      { new: true }
    );

    await Promise.all([
      ElectionModel.findByIdAndUpdate(electionId, { $addToSet: { voters: voterId } }),
      VoterModel.findByIdAndUpdate(voterId, { $addToSet: { votedElections: electionId } }),
    ]);

    return res.status(201).json({
      message: "Vote cast successfully",
      vote,
      candidate: updatedCandidate,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return next(new HttpError("You have already voted in this election.", 409));
    }
    console.log("CAST VOTE ERROR:", error);
    return next(new HttpError("Failed to cast vote", 500));
  }
};

module.exports = {
  castVote,
};
