const Joi = require('joi');
const mongoose = require('mongoose');
const NewsModel = require('../models/NewsModel');
const HttpError = require('../models/ErrorModal');
const { resolveImageInput, resolveImageOutput } = require('../utils/fileStorage');

const newsSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  content: Joi.string().trim().min(10).required(),
  author: Joi.string().trim().max(120).optional(),
  category: Joi.string().trim().max(60).optional(),
  mediaType: Joi.string().valid('image', 'embed', 'link', 'video').optional().allow(null),
  mediaUrl: Joi.string().trim().optional().allow(null, ''),
  summary: Joi.string().trim().max(280).optional(),
  sourceUrl: Joi.string().uri().optional().allow(null, ''),
});

const mapNewsMedia = (post) => {
  if (!post) return post;
  const payload = post.toObject ? post.toObject() : { ...post };
  if (payload.mediaType === 'image' && payload.mediaUrl) {
    payload.mediaUrl = resolveImageOutput(payload.mediaUrl);
  }
  return payload;
};

// ============ Get News
// GET: api/news
const getNews = async (req, res, next) => {
  try {
    const news = await NewsModel.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ news: news.map(mapNewsMedia) });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to load news', 500));
  }
};

// ============ Get News by ID
// GET: api/news/:id
const getNewsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return next(new HttpError('Invalid news ID', 422));
    }

    const post = await NewsModel.findById(id).lean();
    if (!post) {
      return next(new HttpError('News post not found', 404));
    }

    return res.status(200).json({ post: mapNewsMedia(post) });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to load news post', 500));
  }
};

// ============ Create News
// POST: api/news
// PROTECTED (admin)
const createNews = async (req, res, next) => {
  try {
    const { error, value } = newsSchema.validate(req.body || {});
    if (error) {
      return next(new HttpError(error.details[0]?.message || 'Invalid input', 422));
    }

    if (value.mediaType === 'embed' && value.mediaUrl) {
      const looksLikeUrl = /^https?:\/\//i.test(value.mediaUrl);
      if (!looksLikeUrl) {
        return next(new HttpError('Media URL must be a valid link', 422));
      }
    }

    let resolvedMediaUrl = value.mediaUrl || null;
    if (value.mediaType === 'image' && value.mediaUrl) {
      resolvedMediaUrl = await resolveImageInput(
        value.mediaUrl,
        'news',
        'news'
      );
    }

    const post = await NewsModel.create({
      title: value.title.trim(),
      content: value.content.trim(),
      author: value.author?.trim() || req.user?.firstName || 'Admin',
      category: value.category?.trim() || 'General',
      mediaType: value.mediaType ?? null,
      mediaUrl: resolvedMediaUrl || null,
      summary: value.summary || null,
      sourceUrl: value.sourceUrl || null,
    });

    return res.status(201).json({
      message: 'News post created',
      post: mapNewsMedia(post),
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to create news post', 500));
  }
};

// ============ Delete News
// DELETE: api/news/:id
// PROTECTED (admin)
const deleteNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return next(new HttpError('Invalid news ID', 422));
    }

    const deleted = await NewsModel.findByIdAndDelete(id);
    if (!deleted) {
      return next(new HttpError('News post not found', 404));
    }

    return res.status(200).json({
      message: 'News post deleted',
    });
  } catch (error) {
    return next(new HttpError(error.message || 'Failed to delete news post', 500));
  }
};

module.exports = {
  getNews,
  getNewsById,
  createNews,
  deleteNews,
};
