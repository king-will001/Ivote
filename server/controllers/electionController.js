const mongoose = require('mongoose');
const Joi = require('joi');
const ElectionModel = require('../models/electionModel');
const CandidateModel = require('../models/CandidateModel');
const VoteModel = require('../models/VoteModel');
const VoterModel = require('../models/voterModel');
const HttpError = require('../models/ErrorModal');
const { resolveImageInput, resolveImageOutput } = require('../utils/fileStorage');

const electionSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  description: Joi.string().trim().min(10).required(),
  date: Joi.date().iso().optional(),
  startTime: Joi.date().iso().optional(),
  endTime: Joi.date().iso().optional(),
  isActive: Joi.boolean().optional(),
});

const electionUpdateSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).optional(),
  description: Joi.string().trim().min(10).optional(),
  date: Joi.date().iso().optional(),
  startTime: Joi.date().iso().optional(),
  endTime: Joi.date().iso().optional(),
  isActive: Joi.boolean().optional(),
  thumbnail: Joi.string().optional(),
});

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const mapCandidateMedia = (candidate) => {
  if (!candidate || typeof candidate === 'string') return candidate;
  const payload = candidate.toObject ? candidate.toObject() : { ...candidate };
  if (payload.image) {
    payload.image = resolveImageOutput(payload.image);
  }
  return payload;
};

const mapElectionMedia = (election) => {
  if (!election) return election;
  const payload = election.toObject ? election.toObject() : { ...election };
  if (payload.thumbnail) {
    payload.thumbnail = resolveImageOutput(payload.thumbnail);
  }
  if (Array.isArray(payload.candidates)) {
    payload.candidates = payload.candidates.map(mapCandidateMedia);
  }
  return payload;
};

const syncElectionVoteStats = async (electionId) => {
  if (!mongoose.isValidObjectId(electionId)) {
    return;
  }

  const electionObjectId = new mongoose.Types.ObjectId(electionId);
  const [candidates, voteCounts, voterIds] = await Promise.all([
    CandidateModel.find({ election: electionId }).select('_id').lean(),
    VoteModel.aggregate([
      { $match: { election: electionObjectId } },
      { $group: { _id: '$candidate', count: { $sum: 1 } } },
    ]),
    VoteModel.distinct('voter', { election: electionObjectId }),
  ]);

  const countsMap = new Map(
    voteCounts.map((item) => [String(item._id), item.count])
  );

  if (candidates.length) {
    const bulkOps = candidates.map((candidate) => ({
      updateOne: {
        filter: { _id: candidate._id },
        update: { $set: { votesCount: countsMap.get(String(candidate._id)) || 0 } },
      },
    }));
    await CandidateModel.bulkWrite(bulkOps);
  }

  const totalVotes = voteCounts.reduce((sum, item) => sum + item.count, 0);
  await ElectionModel.findByIdAndUpdate(electionId, {
    $set: { voters: voterIds, totalVotes },
  });

  if (voterIds.length) {
    await VoterModel.updateMany(
      { _id: { $in: voterIds } },
      { $addToSet: { votedElections: electionId } }
    );
  }

  await VoterModel.updateMany(
    { votedElections: electionId, _id: { $nin: voterIds } },
    { $pull: { votedElections: electionId } }
  );
};

// ============ Add NEW Election
// POST: api/elections
// PROTECTED (only admin)
const addElection = async (req, res, next) => {
  try {
    const { error, value } = electionSchema.validate(req.body || {});
    if (error) {
      return next(new HttpError(error.details[0]?.message || 'Invalid input', 422));
    }

    const startTime = normalizeDate(value.startTime) || normalizeDate(value.date) || new Date();
    const endTime =
      normalizeDate(value.endTime) || new Date(startTime.getTime() + 86400000);
    const date = normalizeDate(value.date) || new Date(startTime);
    if (endTime.getTime() <= startTime.getTime()) {
      return next(new HttpError('End time must be after start time', 422));
    }
    const now = Date.now();
    const isActive =
      typeof value.isActive === 'boolean'
        ? value.isActive
        : now >= startTime.getTime() && now <= endTime.getTime();

    const bannerFile = req.files?.banner || req.files?.thumbnail;
    const bannerUrl = bannerFile
      ? await resolveImageInput(bannerFile, 'elections', 'election')
      : null;

    const election = await ElectionModel.create({
      title: value.title.trim(),
      description: value.description.trim(),
      date,
      startTime,
      endTime,
      thumbnail: bannerUrl,
      isActive,
      candidates: [],
      voters: [],
    });

    return res.status(201).json({
      message: 'Election created successfully',
      election: mapElectionMedia(election),
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to create election', 500));
  }
};

// ============ Get ALL Elections
// GET: api/elections
// PROTECTED
const getAllElections = async (req, res, next) => {
  try {
    const elections = await ElectionModel.find()
      .sort({ createdAt: -1 })
      .select('title description date startTime endTime thumbnail candidates isActive totalVotes')
      .lean();
    return res.status(200).json({
      message: 'Elections retrieved successfully',
      elections: elections.map(mapElectionMedia),
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to retrieve elections', 500));
  }
};

// ============ Get Election by ID
// GET: api/elections/id
// PROTECTED
const getElection = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return next(new HttpError('Election ID is required', 422));
    }

    if (!mongoose.isValidObjectId(id)) {
      return next(new HttpError('Invalid election ID', 422));
    }

    const election = await ElectionModel.findById(id)
      .populate('candidates', 'firstName lastName fullName motto image votesCount election')
      .lean();

    if (!election) {
      return next(new HttpError('Election not found', 404));
    }

    return res.status(200).json({
      message: 'Election retrieved successfully',
      election: mapElectionMedia(election),
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to retrieve election', 500));
  }
};

// ============ Update Election by ID
// PATCH: api/elections/id
// PROTECTED (only admin)
const updateElection = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return next(new HttpError('Election ID is required', 422));
    }
    if (!mongoose.isValidObjectId(id)) {
      return next(new HttpError('Invalid election ID', 422));
    }

    const { error, value } = electionUpdateSchema.validate(req.body || {});
    if (error) {
      return next(new HttpError(error.details[0]?.message || 'Invalid input', 422));
    }

    const updatePayload = {};
    if (value.title) updatePayload.title = value.title.trim();
    if (value.description) updatePayload.description = value.description.trim();

    if (value.date) {
      const date = normalizeDate(value.date);
      if (!date) {
        return next(new HttpError('Invalid date', 422));
      }
      updatePayload.date = date;
    }

    if (value.startTime) {
      const startTime = normalizeDate(value.startTime);
      if (!startTime) {
        return next(new HttpError('Invalid start time', 422));
      }
      updatePayload.startTime = startTime;
    }

    if (value.endTime) {
      const endTime = normalizeDate(value.endTime);
      if (!endTime) {
        return next(new HttpError('Invalid end time', 422));
      }
      updatePayload.endTime = endTime;
    }

    if (typeof value.isActive === 'boolean') {
      updatePayload.isActive = value.isActive;
    }

    if (typeof value.thumbnail === 'string') {
      const trimmedThumbnail = value.thumbnail.trim();
      if (trimmedThumbnail && !trimmedThumbnail.startsWith('blob:')) {
        const resolvedThumbnail = await resolveImageInput(
          trimmedThumbnail,
          'elections',
          'election'
        );
        if (resolvedThumbnail) {
          updatePayload.thumbnail = resolvedThumbnail;
        }
      }
    }

    const election = await ElectionModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
    });

    if (!election) {
      return next(new HttpError('Election not found', 404));
    }

    return res.status(200).json({
      message: 'Election updated successfully',
      election: mapElectionMedia(election),
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to update election', 500));
  }
};

// ============ Delete Election by ID
// DELETE: api/elections/id
// PROTECTED (only admin)
const deleteElection = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new HttpError('Election ID is required', 422));
    }
    if (!mongoose.isValidObjectId(id)) {
      return next(new HttpError('Invalid election ID', 422));
    }

    const election = await ElectionModel.findByIdAndDelete(id);
    if (!election) {
      return next(new HttpError('Election not found', 404));
    }

    await Promise.all([
      CandidateModel.deleteMany({ election: id }),
      VoteModel.deleteMany({ election: id }),
      VoterModel.updateMany(
        { votedElections: id },
        { $pull: { votedElections: id } }
      ),
    ]);

    return res.status(200).json({
      message: 'Election deleted successfully',
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to delete election', 500));
  }
};

// ============ Get Election Candidates
// GET: api/elections/id/candidates
// PROTECTED
const getElectionCandidates = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new HttpError('Election ID is required', 422));
    }

    if (!mongoose.isValidObjectId(id)) {
      return next(new HttpError('Invalid election ID', 422));
    }

    const candidates = await CandidateModel.find({ election: id })
      .select('firstName lastName fullName motto image votesCount election')
      .lean();

    return res.status(200).json({
      message: 'Candidates retrieved successfully',
      candidates: candidates.map(mapCandidateMedia),
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to retrieve candidates', 500));
  }
};

// ============ Add Candidate to Election
// POST: api/elections/id/candidates
// PROTECTED (only admin)
const addElectionCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, fullName, motto } = req.body || {};

    if (!id) {
      return next(new HttpError('Election ID is required', 422));
    }
    if (!mongoose.isValidObjectId(id)) {
      return next(new HttpError('Invalid election ID', 422));
    }

    let resolvedFirstName = typeof firstName === 'string' ? firstName.trim() : '';
    let resolvedLastName = typeof lastName === 'string' ? lastName.trim() : '';
    const resolvedMotto = typeof motto === 'string' ? motto.trim() : '';

    if ((!resolvedFirstName || !resolvedLastName) && typeof fullName === 'string') {
      const parts = fullName.trim().split(/\s+/).filter(Boolean);
      if (!resolvedFirstName) {
        resolvedFirstName = parts.shift() || '';
      }
      if (!resolvedLastName) {
        resolvedLastName = parts.join(' ');
      }
    }

    if (!resolvedFirstName || !resolvedLastName || !resolvedMotto) {
      return next(new HttpError('Please provide all required fields', 422));
    }

    const imageFile = req.files?.image || req.files?.photo;
    if (!imageFile) {
      return next(new HttpError('Candidate image is required', 422));
    }

    const resolvedImage = await resolveImageInput(
      imageFile,
      'candidates',
      'candidate'
    );

    if (!resolvedImage) {
      return next(new HttpError('Candidate image is required', 422));
    }

    const election = await ElectionModel.findById(id);
    if (!election) {
      return next(new HttpError('Election not found', 404));
    }

    const candidate = await CandidateModel.create({
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      motto: resolvedMotto,
      image: resolvedImage,
      election: id,
    });

    election.candidates.push(candidate._id);
    await election.save();

    return res.status(201).json({
      message: 'Candidate created successfully',
      candidate: mapCandidateMedia(candidate),
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to create candidate', 500));
  }
};

// ============ Delete Candidate from Election
// DELETE: api/elections/id/candidates/candidateId
// PROTECTED (only admin)
const deleteElectionCandidate = async (req, res, next) => {
  try {
    const { id: electionId, candidateId } = req.params;

    if (!electionId || !candidateId) {
      return next(new HttpError('Election ID and candidate ID are required', 422));
    }

    if (!mongoose.isValidObjectId(electionId)) {
      return next(new HttpError('Invalid election ID', 422));
    }
    if (!mongoose.isValidObjectId(candidateId)) {
      return next(new HttpError('Invalid candidate ID', 422));
    }

    const [election, candidate] = await Promise.all([
      ElectionModel.findById(electionId),
      CandidateModel.findById(candidateId),
    ]);

    if (!election) {
      return next(new HttpError('Election not found', 404));
    }
    if (!candidate) {
      return next(new HttpError('Candidate not found', 404));
    }
    if (String(candidate.election) !== String(electionId)) {
      return next(new HttpError('Candidate does not belong to this election', 422));
    }

    await Promise.all([
      VoteModel.deleteMany({ election: electionId, candidate: candidateId }),
      CandidateModel.findByIdAndDelete(candidateId),
      ElectionModel.findByIdAndUpdate(electionId, {
        $pull: { candidates: candidateId },
      }),
    ]);

    await syncElectionVoteStats(electionId);

    return res.status(200).json({
      message: 'Candidate deleted successfully',
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to delete candidate', 500));
  }
};

// ============ Get Election Voters
// GET: api/elections/id/voters
// PROTECTED (only admin)
const getElectionVoters = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new HttpError('Election ID is required', 422));
    }
    if (!mongoose.isValidObjectId(id)) {
      return next(new HttpError('Invalid election ID', 422));
    }

    const election = await ElectionModel.findById(id).lean();
    if (!election) {
      return next(new HttpError('Election not found', 404));
    }

    const votes = await VoteModel.find({ election: id })
      .select('voter createdAt')
      .sort({ createdAt: -1 })
      .populate('voter', 'firstName lastName email')
      .lean();

    const votersWithTime = votes
      .filter((vote) => vote?.voter)
      .map((vote) => ({
        id: vote.voter._id,
        firstName: vote.voter.firstName,
        lastName: vote.voter.lastName,
        fullName: [vote.voter.firstName, vote.voter.lastName].filter(Boolean).join(' ').trim(),
        email: vote.voter.email,
        time: vote.createdAt,
      }));

    return res.status(200).json({
      message: 'Election voters retrieved successfully',
      voters: votersWithTime,
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to retrieve voters', 500));
  }
};

module.exports = {
  addElection,
  getAllElections,
  getElection,
  updateElection,
  deleteElection,
  getElectionCandidates,
  addElectionCandidate,
  deleteElectionCandidate,
  getElectionVoters,
};
