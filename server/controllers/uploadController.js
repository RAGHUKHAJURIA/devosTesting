const cloudinary = require('../config/cloudinary');
const multer = require('multer');

// Use memory storage so we can stream to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

/**
 * Helper: Upload buffer to Cloudinary
 */
const uploadToCloudinary = (buffer, folder = 'blog-app') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
          { width: 1200, crop: 'limit' }, // Max width 1200px
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

/**
 * POST /api/upload
 * Upload a single image
 */
const uploadSingle = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'blog-app/images');

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/upload/multiple
 * Upload multiple images (up to 10)
 */
const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files provided' });
    }

    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, 'blog-app/images')
    );

    const results = await Promise.all(uploadPromises);

    const images = results.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    }));

    res.json({ success: true, data: images });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/upload/:publicId
 * Delete an image from Cloudinary
 */
const deleteImage = async (req, res, next) => {
  try {
    // publicId may contain slashes (folder/name), decode it
    const publicId = decodeURIComponent(req.params.publicId);

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'not found') {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { upload, uploadSingle, uploadMultiple, deleteImage };
