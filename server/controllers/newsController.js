const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const NewsModel = require("../models/newsModel");
const HttpError = require("../models/ErrorModel");
const { fetchExternalNews } = require("../utils/externalNews");
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");

const NEWS_CATEGORIES = ["Tech", "Health", "Education"];

const normalizeCategory = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return (
    NEWS_CATEGORIES.find(
      (category) => category.toLowerCase() === trimmed.toLowerCase()
    ) || null
  );
};

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

const getNews = async (req, res, next) => {
  try {
    const [storedNews, externalNews] = await Promise.all([
      NewsModel.find().sort({ date: -1, createdAt: -1 }).lean(),
      fetchExternalNews(),
    ]);
    const combinedNews = [...externalNews, ...storedNews];
    combinedNews.sort((a, b) => {
      const aTime = new Date(a?.date || a?.createdAt || 0).getTime();
      const bTime = new Date(b?.date || b?.createdAt || 0).getTime();
      const safeATime = Number.isNaN(aTime) ? 0 : aTime;
      const safeBTime = Number.isNaN(bTime) ? 0 : bTime;
      return safeBTime - safeATime;
    });
    return res.status(200).json({
      message: "News retrieved successfully",
      news: combinedNews,
    });
  } catch (error) {
    console.log("GET NEWS ERROR:", error);
    return next(new HttpError("Failed to retrieve news", 500));
  }
};

const createNews = async (req, res, next) => {
  try {
    const auth = getAuthPayload(req);
    if (!auth) {
      return next(new HttpError("Unauthorized", 401));
    }
    if (!auth.isAdmin) {
      return next(new HttpError("Admin access required", 403));
    }

    const { title, content, author, mediaType, mediaUrl, category } = req.body || {};

    if (typeof title !== "string" || !title.trim()) {
      return next(new HttpError("Title is required", 422));
    }

    if (typeof content !== "string" || !content.trim()) {
      return next(new HttpError("Content is required", 422));
    }

    let resolvedCategory = null;
    if (category !== undefined && category !== null) {
      if (typeof category !== "string") {
        return next(new HttpError("Invalid category", 422));
      }
      const trimmedCategory = category.trim();
      if (!trimmedCategory) {
        return next(new HttpError("Category is required", 422));
      }
      resolvedCategory = normalizeCategory(trimmedCategory);
      if (!resolvedCategory) {
        return next(new HttpError("Unsupported category", 422));
      }
    }

    if (!resolvedCategory) {
      resolvedCategory = NEWS_CATEGORIES[0];
    }

    let resolvedMediaType = mediaType ?? null;
    if (resolvedMediaType !== null && typeof resolvedMediaType !== "string") {
      return next(new HttpError("Invalid media type", 422));
    }

    if (resolvedMediaType && !["image", "embed"].includes(resolvedMediaType)) {
      return next(new HttpError("Unsupported media type", 422));
    }

    let resolvedMediaUrl = mediaUrl ?? null;
    const imageFile = req.files?.image;

    // Handle image file upload via express-fileupload
    if (imageFile) {
      try {
        const uploadResult = await uploadToCloudinary(imageFile, 'news');
        resolvedMediaUrl = uploadResult.url;
        resolvedMediaType = 'image';
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        return next(new HttpError("Failed to upload image", 500));
      }
    } else if (resolvedMediaUrl !== null && typeof resolvedMediaUrl !== "string") {
      return next(new HttpError("Invalid media URL", 422));
    } else if (typeof resolvedMediaUrl === "string") {
      resolvedMediaUrl = resolvedMediaUrl.trim() || null;
    }

    if (resolvedMediaType && !resolvedMediaUrl) {
      return next(new HttpError("Media URL is required for the selected media type", 422));
    }

    if (!resolvedMediaType) {
      resolvedMediaUrl = null;
    }

    const fullName = [auth.firstName, auth.lastName].filter(Boolean).join(" ").trim();
    const resolvedAuthor = fullName || (typeof author === "string" && author.trim()) || auth.email || "Admin";

    const post = await NewsModel.create({
      title: title.trim(),
      content: content.trim(),
      author: resolvedAuthor,
      category: resolvedCategory,
      mediaType: resolvedMediaType,
      mediaUrl: resolvedMediaUrl,
      date: new Date(),
    });

    return res.status(201).json({
      message: "News post created successfully",
      post,
    });
  } catch (error) {
    console.log("CREATE NEWS ERROR:", error);
    return next(new HttpError("Failed to create news post", 500));
  }
};

const deleteNews = async (req, res, next) => {
  try {
    const auth = getAuthPayload(req);
    if (!auth) {
      return next(new HttpError("Unauthorized", 401));
    }
    if (!auth.isAdmin) {
      return next(new HttpError("Admin access required", 403));
    }

    const { id } = req.params;
    if (!id) {
      return next(new HttpError("News ID is required", 422));
    }
    if (!mongoose.isValidObjectId(id)) {
      return next(new HttpError("Invalid news ID", 422));
    }

    const deletedPost = await NewsModel.findByIdAndDelete(id);
    if (!deletedPost) {
      return next(new HttpError("News post not found", 404));
    }

    return res.status(200).json({
      message: "News post deleted successfully",
      id,
    });
  } catch (error) {
    console.log("DELETE NEWS ERROR:", error);
    return next(new HttpError("Failed to delete news post", 500));
  }
};

module.exports = {
  getNews,
  createNews,
  deleteNews,
};
