const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  caption: { type: String, default: '' },
});

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    excerpt: {
      type: String,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
      default: '',
    },
    featuredImage: {
      type: imageSchema,
      default: null,
    },
    images: {
      type: [imageSchema],
      default: [],
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      default: 'Anonymous',
    },
    tags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    readingTime: {
      type: Number, // in minutes
      default: 1,
    },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug from title before saving
blogSchema.pre('save', async function (next) {
  if (this.isModified('title') || this.isNew) {
    const slugify = require('slugify');
    let baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;

    // Ensure uniqueness
    while (await mongoose.model('Blog').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${count}`;
      count++;
    }
    this.slug = slug;
  }

  // Auto-generate excerpt from content if not provided
  if (!this.excerpt && this.content) {
    // Strip HTML tags for excerpt
    const text = this.content.replace(/<[^>]*>/g, '');
    this.excerpt = text.slice(0, 200) + (text.length > 200 ? '...' : '');
  }

  // Calculate reading time (avg 200 words/min)
  if (this.content) {
    const wordCount = this.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    this.readingTime = Math.max(1, Math.ceil(wordCount / 200));
  }

  next();
});

// Text index for search
blogSchema.index({ title: 'text', content: 'text', tags: 'text', author: 'text' });
blogSchema.index({ status: 1, createdAt: -1 });
blogSchema.index({ slug: 1 });

module.exports = mongoose.model('Blog', blogSchema);
