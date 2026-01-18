const { Schema, model } = require('mongoose');

const NEWS_CATEGORIES = ["Tech", "Health", "Education"];

const newsSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: NEWS_CATEGORIES,
      default: NEWS_CATEGORIES[0],
    },
    mediaType: { type: String, default: null },
    mediaUrl: { type: String, default: null },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = model('News', newsSchema);
