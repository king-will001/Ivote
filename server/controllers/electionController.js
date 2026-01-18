const mongoose = require("mongoose");
const ElectionModel = require('../models/electionModel');
const CandidateModel = require('../models/CandidateModel');
const VoterModel = require("../models/voterModel");
const VoteModel = require('../models/VoteModel');
const HttpError = require('../models/ErrorModel');
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');
const { v4: uuidv4 } = require('uuid');

const electionUploadsRoot = path.join(__dirname, "..", "uploads", "elections");
const candidateUploadsRoot = path.join(__dirname, "..", "uploads", "candidates");
const dataUrlPattern = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;

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

const saveImage = async (image, rootDir, prefix) => {
    if (typeof image !== "string") {
        return null;
    }

    const trimmed = image.trim();
    if (!trimmed) {
        return null;
    }

    const match = dataUrlPattern.exec(trimmed);
    if (!match) {
        return trimmed;
    }

    const mime = match[1].toLowerCase();
    const base64 = match[2];
    const extension = mime.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const fileName = `${prefix}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${extension}`;
    const filePath = path.join(rootDir, fileName);
    const folderName = path.basename(rootDir);

    await fs.mkdir(rootDir, { recursive: true });
    await fs.writeFile(filePath, Buffer.from(base64, "base64"));
    return `/uploads/${folderName}/${fileName}`;
};

const saveThumbnail = async (thumbnail) => saveImage(thumbnail, electionUploadsRoot, "election");
const saveCandidateImage = async (image) => saveImage(image, candidateUploadsRoot, "candidate");

const syncElectionVoteStats = async (electionId) => {
    if (!mongoose.isValidObjectId(electionId)) {
        return;
    }

    const electionObjectId = new mongoose.Types.ObjectId(electionId);
    const [candidates, voteCounts, voterIds] = await Promise.all([
        CandidateModel.find({ election: electionId }).select("_id").lean(),
        VoteModel.aggregate([
            { $match: { election: electionObjectId } },
            { $group: { _id: "$candidate", count: { $sum: 1 } } },
        ]),
        VoteModel.distinct("voter", { election: electionObjectId }),
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

    await ElectionModel.findByIdAndUpdate(electionId, { $set: { voters: voterIds } });

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
//PROTECTED (only admin)
const addElection = async (req, res, next) => {
  try {
    if (!requireAdmin(req, next)) {
      return;
    }

    const { title, description, date, startTime, endTime } = req.body;
    const bannerFile = req.files?.banner;

    if (!title || !description) {
      return next(new HttpError("Title and description are required", 422));
    }

    let bannerUrl = null;

    if (bannerFile) {
      try {
        const uploadResult = await uploadToCloudinary(bannerFile, 'elections');
        bannerUrl = uploadResult.url;
      } catch (uploadError) {
        console.error("Banner upload failed:", uploadError);
        return next(new HttpError("Failed to upload banner image", 500));
      }
    }

    const election = await ElectionModel.create({
      _id: uuidv4(),
      title: title.trim(),
      description: description.trim(),
      date: date || new Date().toISOString().split('T')[0],
      startTime: startTime || new Date().toISOString(),
      endTime: endTime || new Date(Date.now() + 86400000).toISOString(),
      thumbnail: bannerUrl,
      isActive: false,
      candidates: [],
      voters: [],
    });

    return res.status(201).json({
      message: "Election created successfully",
      election,
    });
  } catch (error) {
    console.log("ADD ELECTION ERROR:", error);
    return next(new HttpError("Failed to create election", 500));
  }
}

// ============ Get ALL Elections
// GET: api/elections
//PROTECTED
const getAllElections = async (req, res, next) => {
    try {
        const electionIds = await ElectionModel.find().select("_id").lean();
        if (electionIds.length) {
            await Promise.all(
                electionIds.map((election) => syncElectionVoteStats(election._id))
            );
        }

        const elections = await ElectionModel.find()
            .populate('candidates')
            .populate('voters');
        
        return res.status(200).json({
            message: "Elections retrieved successfully",
            elections,
        });
    } catch (error) {
        console.log("GET ALL ELECTIONS ERROR:", error);
        return next(new HttpError("Failed to retrieve elections", 500));
    }
}
// ============ Get Election by ID
// GET: api/elections/id
//PROTECTED
const getElection = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return next(new HttpError("Election ID is required", 422));
        }

        await syncElectionVoteStats(id);

        const election = await ElectionModel.findById(id)
            .populate('candidates')
            .populate('voters');
        
        if (!election) {
            return next(new HttpError("Election not found", 404));
        }

        return res.status(200).json({
            message: "Election retrieved successfully",
            election,
        });
    } catch (error) {
        console.log("GET ELECTION ERROR:", error);
        return next(new HttpError("Failed to retrieve election", 500));
    }
}

// ============ Update Election by ID
// PATCH: api/elections/id
//PROTECTED (only admin)
const updateElection = async (req, res, next) => {
    try {
        if (!requireAdmin(req, next)) {
            return;
        }
        const { id } = req.params;
        const { title, description, date, startTime, endTime, isActive, thumbnail } = req.body;

        if (!id) {
            return next(new HttpError("Election ID is required", 422));
        }

        const resolvedThumbnail = await saveThumbnail(thumbnail);
        const updatePayload = { title, description, date, startTime, endTime, isActive };
        if (resolvedThumbnail) {
            updatePayload.thumbnail = resolvedThumbnail;
        }

        const election = await ElectionModel.findByIdAndUpdate(
            id,
            updatePayload,
            { new: true }
        );

        if (!election) {
            return next(new HttpError("Election not found", 404));
        }

        return res.status(200).json({
            message: "Election updated successfully",
            election,
        });
    } catch (error) {
        console.log("UPDATE ELECTION ERROR:", error);
        return next(new HttpError("Failed to update election", 500));
    }
}
// ============ Delete Election by ID
// DELETE: api/elections/id
//PROTECTED (only admin)
const deleteElection = async (req, res, next) => {
    try {
        if (!requireAdmin(req, next)) {
            return;
        }
        const { id } = req.params;

        if (!id) {
            return next(new HttpError("Election ID is required", 422));
        }

        const election = await ElectionModel.findByIdAndDelete(id);

        if (!election) {
            return next(new HttpError("Election not found", 404));
        }

        return res.status(200).json({
            message: "Election deleted successfully",
        });
    } catch (error) {
        console.log("DELETE ELECTION ERROR:", error);
        return next(new HttpError("Failed to delete election", 500));
    }
}

// ============ Get Election Candidates
// GET: api/elections/id/candidates
//PROTECTED
const getElectionCandidates = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return next(new HttpError("Election ID is required", 422));
        }

        const candidates = await CandidateModel.find({ election: id });

        return res.status(200).json({
            message: "Candidates retrieved successfully",
            candidates,
        });
    } catch (error) {
        console.log("GET ELECTION CANDIDATES ERROR:", error);
        return next(new HttpError("Failed to retrieve candidates", 500));
    }
}

// ============ Add Candidate to Election
// POST: api/elections/id/candidates
//PROTECTED (only admin)
const addElectionCandidate = async (req, res, next) => {
    try {
        if (!requireAdmin(req, next)) {
            return;
        }
        const { id } = req.params;
        const {
            firstName,
            lastName,
            fullName,
            motto,
            election: electionFromBody
        } = req.body || {};
        const imageFile = req.files?.image; // File upload from express-fileupload
        const electionId = id || electionFromBody;

        if (!electionId) {
            return next(new HttpError("Election ID is required", 422));
        }

        let resolvedFirstName = typeof firstName === "string" ? firstName.trim() : "";
        let resolvedLastName = typeof lastName === "string" ? lastName.trim() : "";
        const resolvedMotto = typeof motto === "string" ? motto.trim() : "";

        if ((!resolvedFirstName || !resolvedLastName) && typeof fullName === "string") {
            const parts = fullName.trim().split(/\s+/).filter(Boolean);
            if (!resolvedFirstName) {
                resolvedFirstName = parts.shift() || "";
            }
            if (!resolvedLastName) {
                resolvedLastName = parts.join(" ");
            }
        }

        if (!resolvedFirstName || !resolvedLastName || !resolvedMotto) {
            return next(new HttpError("Please provide all required fields", 422));
        }

        if (!imageFile) {
            return next(new HttpError("Candidate image is required", 422));
        }

        let resolvedImage;
        try {
            const uploadResult = await uploadToCloudinary(imageFile, 'candidates');
            resolvedImage = uploadResult.url;
        } catch (uploadError) {
            console.error("Image upload failed:", uploadError);
            return next(new HttpError("Failed to upload image", 500));
        }
        if (!resolvedImage) {
            return next(new HttpError("Candidate image is required", 422));
        }

        const election = await ElectionModel.findById(electionId);
        if (!election) {
            return next(new HttpError("Election not found", 404));
        }

        const candidate = await CandidateModel.create({
            firstName: resolvedFirstName,
            lastName: resolvedLastName,
            motto: resolvedMotto,
            image: resolvedImage,
            election: electionId,
        });

        election.candidates.push(candidate._id);
        await election.save();

        return res.status(201).json({
            message: "Candidate created successfully",
            candidate,
        });
    } catch (error) {
        console.log("ADD CANDIDATE ERROR:", error);
        return next(new HttpError("Failed to create candidate", 500));
    }
}
// ============ Get Election Voters
// GET: api/elections/id/voters
//PROTECTED (only admin)
const getElectionVoters = async (req, res, next) => {
    try {
        if (!requireAdmin(req, next)) {
            return;
        }
        const { id } = req.params;

        if (!id) {
            return next(new HttpError("Election ID is required", 422));
        }

        await syncElectionVoteStats(id);

        const election = await ElectionModel.findById(id).populate('voters');

        if (!election) {
            return next(new HttpError("Election not found", 404));
        }

        const votes = await VoteModel.find({ election: id })
          .sort({ createdAt: -1 })
          .populate('voter');

        const votersWithTime = votes
          .filter((vote) => vote?.voter)
          .map((vote) => {
            const voter = vote.voter;
            const fullName = [voter.firstName, voter.lastName].filter(Boolean).join(" ").trim();
            return {
              id: voter._id,
              firstName: voter.firstName,
              lastName: voter.lastName,
              fullName,
              email: voter.email,
              time: vote.createdAt,
            };
          });

        if (votersWithTime.length) {
          return res.status(200).json({
            message: "Election voters retrieved successfully",
            voters: votersWithTime,
          });
        }

        return res.status(200).json({
            message: "Election voters retrieved successfully",
            voters: election.voters,
        });
    } catch (error) {
        console.log("GET ELECTION VOTERS ERROR:", error);
        return next(new HttpError("Failed to retrieve voters", 500));
    }
}

module.exports = {
    addElection,
    getAllElections,
    getElection,
    updateElection,
    deleteElection,
    getElectionCandidates,
    getElectionVoters,
    addElectionCandidate
}
