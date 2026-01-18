const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (file, folder = 'ivote') => {
  try {
    const uniqueName = `${folder}_${uuidv4()}_${Date.now()}`;
    
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      public_id: uniqueName,
      folder: folder,
      resource_type: 'auto',
    });

    // Clean up temp file
    fs.unlinkSync(file.tempFilePath);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

module.exports = { uploadToCloudinary };