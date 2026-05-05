const Joi = require('joi');

/**
 * Creates a validation middleware from a Joi schema.
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
  if (error) {
    const errors = error.details.map((d) => d.message);
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }
  next();
};

// Blog creation schema
const createBlogSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  content: Joi.string().min(10).required(),
  excerpt: Joi.string().max(500).allow('').optional(),
  author: Joi.string().min(1).max(100).required(),
  tags: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  category: Joi.string().max(100).allow('').optional(),
  status: Joi.string().valid('draft', 'published').optional(),
  metaTitle: Joi.string().max(200).allow('').optional(),
  metaDescription: Joi.string().max(300).allow('').optional(),
  featuredImage: Joi.any().optional(),
  images: Joi.any().optional(),
});

// Blog update schema (all optional)
const updateBlogSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  content: Joi.string().min(10).optional(),
  excerpt: Joi.string().max(500).allow('').optional(),
  author: Joi.string().min(1).max(100).optional(),
  tags: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  category: Joi.string().max(100).allow('').optional(),
  status: Joi.string().valid('draft', 'published').optional(),
  metaTitle: Joi.string().max(200).allow('').optional(),
  metaDescription: Joi.string().max(300).allow('').optional(),
  featuredImage: Joi.any().optional(),
  images: Joi.any().optional(),
});

module.exports = { validate, createBlogSchema, updateBlogSchema };
