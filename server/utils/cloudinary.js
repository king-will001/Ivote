const { URL } = require('url');
const cloudinary = require('cloudinary').v2;

const parseCloudinaryUrl = (value) => {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    const cloudName = parsed.hostname;
    const apiKey = decodeURIComponent(parsed.username || '');
    const apiSecret = decodeURIComponent(parsed.password || '');
    if (!cloudName || !apiKey || !apiSecret) return null;
    return { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret };
  } catch (error) {
    return null;
  }
};

const resolveCloudinaryConfig = () => {
  if (process.env.CLOUDINARY_URL) {
    const parsed = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
    if (parsed) return parsed;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    return { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret };
  }

  return null;
};

const cloudinaryConfig = resolveCloudinaryConfig();
const isCloudinaryConfigured = Boolean(cloudinaryConfig);

if (isCloudinaryConfigured) {
  cloudinary.config({
    ...cloudinaryConfig,
    secure: true,
  });
}

const getCloudinaryConfig = () => cloudinaryConfig;

const getUploadType = () =>
  process.env.CLOUDINARY_UPLOAD_TYPE ||
  process.env.CLOUDINARY_DELIVERY_TYPE ||
  'authenticated';

const getDeliveryType = () =>
  process.env.CLOUDINARY_DELIVERY_TYPE ||
  process.env.CLOUDINARY_UPLOAD_TYPE ||
  'authenticated';

const getSignedUrlTtlSeconds = () => {
  const ttl = Number(process.env.CLOUDINARY_SIGNED_URL_TTL_SECONDS);
  if (Number.isFinite(ttl) && ttl > 0) return ttl;
  return 300;
};

const ensureCloudinary = () => {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured');
  }
  return cloudinary;
};

const uploadImage = async ({ dataUrl, folder, publicId }) => {
  const uploader = ensureCloudinary().uploader;
  const options = {
    resource_type: 'image',
    folder: folder || undefined,
    public_id: publicId || undefined,
    overwrite: false,
    type: getUploadType(),
  };
  return uploader.upload(dataUrl, options);
};

const buildSignedImageUrl = (publicId, options = {}) => {
  if (!publicId || !isCloudinaryConfigured) return null;

  const expiresInSeconds =
    Number(options.expiresInSeconds) || getSignedUrlTtlSeconds();
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  return cloudinary.url(publicId, {
    resource_type: 'image',
    type: options.deliveryType || getDeliveryType(),
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
  });
};

module.exports = {
  isCloudinaryConfigured,
  getCloudinaryConfig,
  uploadImage,
  buildSignedImageUrl,
};
