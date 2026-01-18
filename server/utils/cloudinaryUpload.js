const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Cloudinary automatically reads from CLOUDINARY_URL env variable
// No need to manually configure if CLOUDINARY_URL is set
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true,
  });
} else {
  // Fallback to individual credentials if CLOUDINARY_URL is not set
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const uploadToCloudinary = async (file, folder = 'ivote') => {
  try {
    if (!file) {
      throw new Error('No file provided for upload');
    }

    // Check if this is an uploaded file (from express-fileupload) or a data URL
    let uploadPath;
    
    if (typeof file === 'string') {
      // Handle base64 data URL
      uploadPath = file;
    } else if (file.tempFilePath) {
      // Handle multipart file upload from express-fileupload
      uploadPath = file.tempFilePath;
    } else {
      throw new Error('Invalid file format');
    }

    const uniqueName = `${folder}_${uuidv4()}_${Date.now()}`;
    
    const result = await cloudinary.uploader.upload(uploadPath, {
      public_id: uniqueName,
      folder: folder,
      resource_type: 'auto',
    });

    // Clean up temp file if it's a file upload
    if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
      fs.unlinkSync(file.tempFilePath);
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      fileName: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    // Clean up temp file on error
    if (file?.tempFilePath && fs.existsSync(file.tempFilePath)) {
      try {
        fs.unlinkSync(file.tempFilePath);
      } catch (e) {
        console.error('Failed to clean up temp file:', e);
      }
    }
    
    throw error;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      console.warn('No public ID provided for deletion');
      return;
    }

    await cloudinary.uploader.destroy(publicId);
    console.log('Successfully deleted from Cloudinary:', publicId);
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw error;
  }
};

// Generate optimized image URL with transformations
const getOptimizedImageUrl = (publicId, options = {}) => {
  const defaultOptions = {
    fetch_format: 'auto',      // Auto-format based on client capability
    quality: 'auto',           // Auto-quality optimization
    crop: 'fill',              // Fill the specified dimensions
    gravity: 'auto',           // Auto-detect focal point
  };

  const finalOptions = { ...defaultOptions, ...options };
  return cloudinary.url(publicId, finalOptions);
};

// Generate candidate photo URL (optimized for profile pictures)
const getCandidatePhotoUrl = (publicId, width = 400, height = 400) => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    crop: 'fill',
    gravity: 'face',           // Focus on face for candidate photos
    width,
    height,
    radius: 'max',             // Rounded corners
  });
};

// Generate election banner URL (optimized for wide displays)
const getElectionBannerUrl = (publicId, width = 1200, height = 400) => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    crop: 'fill',
    gravity: 'auto',
    width,
    height,
  });
};

// Generate news image URL (optimized for responsive display)
const getNewsImageUrl = (publicId, width = 800, height = 450) => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    crop: 'fill',
    gravity: 'auto',
    width,
    height,
  });
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getOptimizedImageUrl,
  getCandidatePhotoUrl,
  getElectionBannerUrl,
  getNewsImageUrl,
};
