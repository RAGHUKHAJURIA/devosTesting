const express = require('express');
const router = express.Router();
const { upload, uploadSingle, uploadMultiple, deleteImage } = require('../controllers/uploadController');
const adminAuth = require('../middleware/adminAuth');

// All upload routes require admin auth
router.post('/', adminAuth, upload.single('image'), uploadSingle);
router.post('/multiple', adminAuth, upload.array('images', 10), uploadMultiple);
router.delete('/:publicId', adminAuth, deleteImage);

module.exports = router;
