// src/middlewares/multer.middleware.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/apiError');

// -------------------------------------------
// Ensure the uploads/ directory exists
// -------------------------------------------
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// -------------------------------------------
// Disk storage configuration
// -------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Unique filename: fieldname-timestamp-random.ext
    // e.g., "productImage-1720598400000-123456789.jpg"
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// -------------------------------------------
// File filter — only allow image files
// -------------------------------------------
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WEBP images are allowed.`
      ),
      false
    );
  }
};

// -------------------------------------------
// Multer instance with size limit from .env
// -------------------------------------------
const maxFileSizeMB = Number(process.env.MAX_FILE_UPLOAD_MB) || 5;

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: maxFileSizeMB * 1024 * 1024, // convert MB to bytes
  },
});

// =========================================
// EXPORTED UPLOAD CONFIGURATIONS
// =========================================

/**
 * Single image upload — used for user avatar, category image,
 * subcategory image, banner image.
 * Usage: router.post('/avatar', uploadSingleImage('avatar'), controller)
 */
const uploadSingleImage = (fieldName) => upload.single(fieldName);

/**
 * Multiple image upload — used for product image gallery (up to 5 images)
 * and review images (up to 3 images).
 * Usage: router.post('/products', uploadMultipleImages('images', 5), controller)
 */
const uploadMultipleImages = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);

/**
 * Helper to delete a local temp file after it's been uploaded to Cloudinary
 * (or if an error occurs and we need to clean up). Controllers will call
 * this after successfully uploading to Cloudinary.
 */
const deleteLocalFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      // ENOENT means file already doesn't exist — safe to ignore
      console.error(`Failed to delete local temp file ${filePath}:`, err.message);
    }
  });
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  deleteLocalFile,
};