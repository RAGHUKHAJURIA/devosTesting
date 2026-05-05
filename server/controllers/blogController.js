const Blog = require('../models/Blog');
const cloudinary = require('../config/cloudinary');

/**
 * GET /api/blogs
 * Query params: page, limit, search, tag, category, status
 */
const getAllBlogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      tag,
      category,
      status = 'published',
    } = req.query;

    const filter = {};

    // Only admin can view drafts — public gets published only
    if (status === 'all') {
      // no status filter (admin only)
    } else {
      filter.status = status;
    }

    // Full-text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Tag filter
    if (tag) {
      filter.tags = { $in: [tag] };
    }

    // Category filter
    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .select('-content') // Exclude heavy content field in list view
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Blog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: blogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/blogs/:id
 * Accepts both ObjectId and slug
 */
const getBlogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try slug first, then ObjectId
    let blog = await Blog.findOne({ slug: id });
    if (!blog) {
      blog = await Blog.findById(id);
    }

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    // Increment view count
    blog.viewCount += 1;
    await blog.save();

    // Get related posts (same category or tags, exclude current)
    const relatedBlogs = await Blog.find({
      _id: { $ne: blog._id },
      status: 'published',
      $or: [
        { category: blog.category },
        { tags: { $in: blog.tags } },
      ],
    })
      .select('title slug excerpt featuredImage author createdAt readingTime tags')
      .limit(3)
      .lean();

    res.json({
      success: true,
      data: blog,
      relatedBlogs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/blogs
 * Requires admin auth
 */
const createBlog = async (req, res, next) => {
  try {
    let { title, content, excerpt, author, tags, category, status, metaTitle, metaDescription, featuredImage, images } = req.body;

    // Parse tags if sent as JSON string
    if (typeof tags === 'string') {
      try { tags = JSON.parse(tags); } catch { tags = tags.split(',').map(t => t.trim()).filter(Boolean); }
    }
    if (typeof featuredImage === 'string') {
      try { featuredImage = JSON.parse(featuredImage); } catch { featuredImage = null; }
    }
    if (typeof images === 'string') {
      try { images = JSON.parse(images); } catch { images = []; }
    }

    const blog = await Blog.create({
      title, content, excerpt, author, tags, category, status,
      metaTitle, metaDescription, featuredImage, images,
    });

    res.status(201).json({ success: true, message: 'Blog created successfully', data: blog });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/blogs/:id
 * Requires admin auth
 */
const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    // Parse tags if sent as JSON string
    if (typeof updateData.tags === 'string') {
      try { updateData.tags = JSON.parse(updateData.tags); }
      catch { updateData.tags = updateData.tags.split(',').map(t => t.trim()).filter(Boolean); }
    }
    if (typeof updateData.featuredImage === 'string') {
      try { updateData.featuredImage = JSON.parse(updateData.featuredImage); }
      catch { updateData.featuredImage = null; }
    }
    if (typeof updateData.images === 'string') {
      try { updateData.images = JSON.parse(updateData.images); }
      catch { updateData.images = []; }
    }

    let blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    Object.assign(blog, updateData);
    await blog.save();

    res.json({ success: true, message: 'Blog updated successfully', data: blog });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/blogs/:id
 * Requires admin auth. Also removes Cloudinary images.
 */
const deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    // Collect all Cloudinary publicIds to delete
    const publicIds = [];
    if (blog.featuredImage?.publicId) publicIds.push(blog.featuredImage.publicId);
    blog.images.forEach((img) => { if (img.publicId) publicIds.push(img.publicId); });

    // Delete images from Cloudinary
    if (publicIds.length > 0) {
      await Promise.allSettled(
        publicIds.map((pid) => cloudinary.uploader.destroy(pid))
      );
    }

    await Blog.findByIdAndDelete(id);

    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/blogs/tags
 * Returns all unique tags from published blogs
 */
const getAllTags = async (req, res, next) => {
  try {
    const tags = await Blog.distinct('tags', { status: 'published' });
    const categories = await Blog.distinct('category', { status: 'published' });
    res.json({ success: true, data: { tags, categories } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllBlogs, getBlogById, createBlog, updateBlog, deleteBlog, getAllTags };
