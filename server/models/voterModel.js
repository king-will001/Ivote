const { Schema, model, Types } = require('mongoose');

// Voter Schema
const voterSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    // FIX: voters do NOT start with voted elections
    votedElections: [
      { type: Types.ObjectId, ref: 'Election', default: [] }
    ],

    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Export model
module.exports = model('Voter', voterSchema);
