const { Schema, model } = require('mongoose');

const newsSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    author: { type: String, default: 'Admin', trim: true },
    category: { type: String, default: 'General', trim: true },
    mediaUrl: { type: String, trim: true },
    mediaType: { type: String, enum: ['image', 'embed', 'link', 'video', null], default: null },
    summary: { type: String, trim: true },
    sourceUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = model('News', newsSchema);
