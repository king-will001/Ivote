const { Schema, model, Types } = require('mongoose');

const electionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    thumbnail: { type: String },
    candidates: [{ type: Types.ObjectId, ref: 'Candidate' }],
    voters: [{ type: Types.ObjectId, ref: 'Voter' }],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    totalVotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

electionSchema.index({ startTime: 1, endTime: 1 });

module.exports = model('Election', electionSchema);
