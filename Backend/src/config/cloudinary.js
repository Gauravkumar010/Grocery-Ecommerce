// src/config/cloudinary.js

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const logger = require('../utils/logger');

// -------------------------------------------
// Configure Cloudinary SDK with credentials from .env
// -------------------------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file (from Multer's temp disk storage) to Cloudinary,
 * then deletes the local temp file regardless of success or failure.
 *
 * @param {string} localFilePath - path to the temp file on local disk
 * @param {string} folder - Cloudinary folder to organize uploads (e.g., 'grocery/products')
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadToCloudinary = async (localFilePath, folder = 'grocery/misc') => {
  try {
    if (!localFilePath) {
      throw new Error('No file path provided for upload');
    }

    const result = await cloudinary.uploader.upload(localFilePath, {
      folder,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    logger.error(`Cloudinary upload failed: ${error.message}`);
    throw error;
  } finally {
    // Always clean up the local temp file, whether upload succeeded or failed
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlink(localFilePath, (err) => {
        if (err) logger.error(`Failed to delete local temp file: ${err.message}`);
      });
    }
  }
};

/**
 * Deletes an image from Cloudinary using its publicId.
 * Used when a product/category/banner is deleted, or an image is replaced.
 *
 * @param {string} publicId - the Cloudinary public_id of the image to delete
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error(`Cloudinary deletion failed for ${publicId}: ${error.message}`);
    throw error;
  }
};

/**
 * Uploads multiple local files to Cloudinary in parallel.
 * Used for product image galleries (multiple images at once).
 *
 * @param {string[]} localFilePaths - array of temp file paths
 * @param {string} folder - Cloudinary folder
 * @returns {Promise<Array<{url: string, publicId: string}>>}
 */
const uploadMultipleToCloudinary = async (localFilePaths, folder = 'grocery/misc') => {
  const uploadPromises = localFilePaths.map((filePath) => uploadToCloudinary(filePath, folder));
  return Promise.all(uploadPromises);
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadMultipleToCloudinary,
};