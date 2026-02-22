const { URL } = require('url');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const {
  isCloudinaryConfigured,
  getCloudinaryConfig,
  uploadImage,
  buildSignedImageUrl,
} = require('./cloudinary');

const dataUrlPattern = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const allowedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const CLOUDINARY_VALUE_PREFIX = 'cld:';

const shouldUseCloudinary = () => {
  const provider = String(process.env.FILE_STORAGE_PROVIDER || '')
    .trim()
    .toLowerCase();
  if (provider === 'local') return false;
  if (provider === 'cloudinary') return true;
  return isCloudinaryConfigured;
};

const extensionFromMime = (mime) => {
  switch (mime) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/avif':
      return '.avif';
    default:
      return '';
  }
};

const detectImageMime = (buffer) => {
  if (!buffer || buffer.length < 12) return null;
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  // WEBP (RIFF....WEBP)
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  // AVIF (ISO BMFF brand)
  if (buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12);
    if (brand === 'avif' || brand === 'avis' || brand === 'av01') {
      return 'image/avif';
    }
  }
  return null;
};

const ensureWithinLimit = (byteLength) => {
  if (byteLength > MAX_IMAGE_BYTES) {
    throw new Error('Image too large');
  }
};

const validateImageBuffer = (buffer, declaredMime) => {
  if (!buffer) return;
  const detected = detectImageMime(buffer);
  if (!detected || !allowedImageTypes.has(detected)) {
    throw new Error('Unsupported image format');
  }
  if (declaredMime && detected !== declaredMime.toLowerCase()) {
    throw new Error('Unsupported image format');
  }
};

const isSafeImageUrl = (value) => {
  if (!value) return false;
  if (value.startsWith(CLOUDINARY_VALUE_PREFIX)) return true;
  if (value.startsWith('/')) return true;
  return /^https?:\/\//i.test(value);
};

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const buildFileName = (prefix, extension) => {
  const safeExt = extension ? extension.toLowerCase() : '';
  return `${prefix}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${safeExt}`;
};

const normalizeCloudinaryFolder = (folder) => {
  const root = String(process.env.CLOUDINARY_FOLDER_PREFIX || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  const child = String(folder || '').trim().replace(/^\/+|\/+$/g, '');
  if (root && child) return `${root}/${child}`;
  if (root) return root;
  if (child) return child;
  return undefined;
};

const toCloudinaryStoredValue = (publicId) =>
  publicId ? `${CLOUDINARY_VALUE_PREFIX}${publicId}` : null;

const fromCloudinaryStoredValue = (value) =>
  value && value.startsWith(CLOUDINARY_VALUE_PREFIX)
    ? value.slice(CLOUDINARY_VALUE_PREFIX.length)
    : value;

const extractCloudinaryPublicId = (url) => {
  if (!url || !isCloudinaryConfigured) return null;
  const config = getCloudinaryConfig();
  const cloudName = config?.cloud_name;
  if (!cloudName) return null;

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'res.cloudinary.com') return null;
    if (!parsed.pathname.startsWith(`/${cloudName}/`)) return null;

    const match = parsed.pathname.match(/\/v\d+\/(.+)$/);
    if (!match) return null;
    const withExtension = match[1];
    return withExtension.replace(/\.[^/.]+$/, '');
  } catch (error) {
    return null;
  }
};

const dataUrlFromBuffer = (buffer, mime) =>
  `data:${mime};base64,${buffer.toString('base64')}`;

const uploadBufferToCloudinary = async ({ buffer, mime, folder, prefix }) => {
  if (!buffer) {
    throw new Error('File buffer missing');
  }
  if (!mime || !allowedImageTypes.has(mime)) {
    throw new Error('Unsupported image format');
  }

  const dataUrl = dataUrlFromBuffer(buffer, mime);
  const publicId = buildFileName(prefix, '');
  const result = await uploadImage({
    dataUrl,
    folder: normalizeCloudinaryFolder(folder),
    publicId,
  });
  return result?.public_id || publicId;
};

const saveBase64Image = async (dataUrl, folder, prefix) => {
  const match = dataUrlPattern.exec(dataUrl);
  if (!match) {
    return null;
  }
  const mime = match[1].toLowerCase();
  if (!allowedImageTypes.has(mime)) {
    throw new Error('Unsupported image format');
  }
  const buffer = Buffer.from(match[2], 'base64');
  ensureWithinLimit(buffer.length);
  validateImageBuffer(buffer, mime);
  const extension = extensionFromMime(mime);
  if (shouldUseCloudinary()) {
    const publicId = await uploadBufferToCloudinary({
      buffer,
      mime,
      folder,
      prefix,
    });
    return toCloudinaryStoredValue(publicId);
  }

  const fileName = buildFileName(prefix, extension);
  const dir = path.join(__dirname, '..', 'uploads', folder);
  await ensureDir(dir);
  const filePath = path.join(dir, fileName);
  await fs.writeFile(filePath, buffer);
  return `/uploads/${folder}/${fileName}`;
};

const saveUploadedFile = async (file, folder, prefix) => {
  if (!file) {
    return null;
  }
  const mime = file.mimetype ? file.mimetype.toLowerCase() : '';
  if (mime && !allowedImageTypes.has(mime)) {
    throw new Error('Unsupported image format');
  }
  const fileSize = typeof file.size === 'number' ? file.size : file.data?.length;
  if (fileSize) {
    ensureWithinLimit(fileSize);
  }

  const fileBuffer = file.data
    ? file.data
    : file.tempFilePath
      ? await fs.readFile(file.tempFilePath)
      : null;
  if (fileBuffer) {
    validateImageBuffer(fileBuffer, mime || null);
  }

  const nameExt = path.extname(file.name || '').toLowerCase();
  const extension = allowedExtensions.has(nameExt)
    ? nameExt
    : extensionFromMime(mime);
  if (!extension) {
    throw new Error('Unsupported image format');
  }
  if (shouldUseCloudinary()) {
    if (!fileBuffer) {
      throw new Error('File buffer missing');
    }
    const detected = mime || detectImageMime(fileBuffer);
    const publicId = await uploadBufferToCloudinary({
      buffer: fileBuffer,
      mime: detected,
      folder,
      prefix,
    });
    return toCloudinaryStoredValue(publicId);
  }

  const fileName = buildFileName(prefix, extension);
  const dir = path.join(__dirname, '..', 'uploads', folder);
  await ensureDir(dir);
  const filePath = path.join(dir, fileName);
  await file.mv(filePath);
  return `/uploads/${folder}/${fileName}`;
};

const resolveImageInput = async (input, folder, prefix) => {
  if (!input) {
    return null;
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      return null;
    }
    if (trimmed.startsWith('data:image/')) {
      return saveBase64Image(trimmed, folder, prefix);
    }
    if (trimmed.startsWith(CLOUDINARY_VALUE_PREFIX)) {
      return trimmed;
    }
    const publicIdFromUrl = extractCloudinaryPublicId(trimmed);
    if (publicIdFromUrl) {
      return toCloudinaryStoredValue(publicIdFromUrl);
    }
    if (!isSafeImageUrl(trimmed)) {
      throw new Error('Invalid image URL');
    }
    return trimmed;
  }
  if (typeof input.mv === 'function') {
    return saveUploadedFile(input, folder, prefix);
  }
  return null;
};

const resolveImageOutput = (value, options = {}) => {
  if (!value || typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('data:')) return trimmed;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }
  if (!shouldUseCloudinary()) {
    return trimmed;
  }
  const publicId = fromCloudinaryStoredValue(trimmed);
  return buildSignedImageUrl(publicId, options) || trimmed;
};

module.exports = {
  resolveImageInput,
  resolveImageOutput,
  saveUploadedFile,
  saveBase64Image,
};
