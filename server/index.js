require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const RSS = require('rss');
const connectDB = require('./config/db');
const blogRoutes = require('./routes/blogs');
const uploadRoutes = require('./routes/upload');
const errorHandler = require('./middleware/errorHandler');
const Blog = require('./models/Blog');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ── Security & Utility Middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(morgan('dev'));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many upload requests.' },
});

app.use('/api', apiLimiter);
app.use('/api/upload', uploadLimiter);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/blogs', blogRoutes);
app.use('/api/upload', uploadRoutes);

// ── RSS Feed ──────────────────────────────────────────────────────────────────
app.get('/api/rss', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const feed = new RSS({
      title: 'DevBlog RSS Feed',
      description: 'Latest blog posts from DevBlog',
      feed_url: `${process.env.CLIENT_URL}/api/rss`,
      site_url: process.env.CLIENT_URL || 'http://localhost:3000',
      language: 'en',
      pubDate: new Date(),
    });

    blogs.forEach((blog) => {
      feed.item({
        title: blog.title,
        description: blog.excerpt,
        url: `${process.env.CLIENT_URL}/blog/${blog.slug}`,
        author: blog.author,
        date: blog.createdAt,
        categories: blog.tags,
      });
    });

    res.set('Content-Type', 'application/rss+xml');
    res.send(feed.xml({ indent: true }));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate RSS feed' });
  }
});

// ── Sitemap ───────────────────────────────────────────────────────────────────
app.get('/api/sitemap', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' }).select('slug updatedAt').lean();
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    const urls = [
      `<url><loc>${baseUrl}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
      ...blogs.map(
        (b) =>
          `<url><loc>${baseUrl}/blog/${b.slug}</loc><lastmod>${new Date(b.updatedAt).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
      ),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate sitemap' });
  }
});

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date() });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
