const express = require('express');
const router = express.Router();
const {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getAllTags,
} = require('../controllers/blogController');
const adminAuth = require('../middleware/adminAuth');
const { validate, createBlogSchema, updateBlogSchema } = require('../middleware/validate');

// Public routes
router.get('/tags', getAllTags);
router.get('/', getAllBlogs);
router.get('/:id', getBlogById);

// Admin-protected routes
router.post('/', adminAuth, validate(createBlogSchema), createBlog);
router.put('/:id', adminAuth, validate(updateBlogSchema), updateBlog);
router.delete('/:id', adminAuth, deleteBlog);

module.exports = router;
