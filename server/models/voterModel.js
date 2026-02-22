const { Schema, model, Types } = require('mongoose');

const voterSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    votedElections: [{ type: Types.ObjectId, ref: 'Election' }],
    refreshTokenHash: { type: String, select: false },
    refreshTokenExpiresAt: { type: Date },
    refreshTokenCreatedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = model('Voter', voterSchema);
