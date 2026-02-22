const { Schema, model, Types } = require('mongoose');

const voteSchema = new Schema(
  {
    election: { type: Types.ObjectId, ref: 'Election', required: true },
    candidate: { type: Types.ObjectId, ref: 'Candidate', required: true },
    voter: { type: Types.ObjectId, ref: 'Voter', required: true },
  },
  { timestamps: true }
);

voteSchema.index({ election: 1, voter: 1 }, { unique: true });
voteSchema.index({ election: 1, candidate: 1 });
voteSchema.index({ election: 1, createdAt: -1 });

module.exports = model('Vote', voteSchema);
