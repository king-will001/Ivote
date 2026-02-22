const { Schema, model, Types } = require('mongoose');

const candidateSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    election: { type: Types.ObjectId, ref: 'Election', required: true },
    votesCount: { type: Number, default: 0 },
    motto: { type: String, required: true, trim: true },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

candidateSchema.index({ election: 1 });

module.exports = model('Candidate', candidateSchema);
