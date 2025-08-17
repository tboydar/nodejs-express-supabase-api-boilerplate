const Joi = require('joi');
const { AppError } = require('./errorHandler');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(message, 400));
    }
    
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params, { abortEarly: false });
    
    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(message, 400));
    }
    
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(message, 400));
    }
    
    next();
  };
};

// Common validation schemas
const schemas = {
  // UUID validation
  uuid: Joi.string().uuid().required(),
  
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // Product schemas
  createProduct: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    description: Joi.string().optional(),
    price: Joi.number().positive().precision(2).required(),
    stock_quantity: Joi.number().integer().min(0).required(),
    category_id: Joi.string().uuid().optional(),
    image_url: Joi.string().uri().optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    sku: Joi.string().max(100).optional(),
    weight: Joi.number().positive().optional(),
    dimensions: Joi.object().optional(),
  }),

  updateProduct: Joi.object({
    name: Joi.string().min(1).max(200).optional(),
    description: Joi.string().optional(),
    price: Joi.number().positive().precision(2).optional(),
    stock_quantity: Joi.number().integer().min(0).optional(),
    category_id: Joi.string().uuid().allow(null).optional(),
    image_url: Joi.string().uri().optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    sku: Joi.string().max(100).optional(),
    weight: Joi.number().positive().optional(),
    dimensions: Joi.object().optional(),
    is_active: Joi.boolean().optional(),
  }),

  // Category schemas
  createCategory: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().optional(),
    image_url: Joi.string().uri().optional(),
  }),

  updateCategory: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().optional(),
    image_url: Joi.string().uri().optional(),
    is_active: Joi.boolean().optional(),
  }),

  // User schemas
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    full_name: Joi.string().min(1).max(100).optional(),
    phone: Joi.string().max(20).optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    full_name: Joi.string().min(1).max(100).optional(),
    phone: Joi.string().max(20).optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      postal_code: Joi.string().optional(),
      country: Joi.string().optional(),
    }).optional(),
    avatar_url: Joi.string().uri().optional(),
  }),

  // Cart schemas
  addToCart: Joi.object({
    product_id: Joi.string().uuid().required(),
    quantity: Joi.number().integer().min(1).required(),
  }),

  updateCartItem: Joi.object({
    quantity: Joi.number().integer().min(1).required(),
  }),

  // Order schemas
  createOrder: Joi.object({
    shipping_address: Joi.object({
      full_name: Joi.string().required(),
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postal_code: Joi.string().required(),
      country: Joi.string().required(),
      phone: Joi.string().optional(),
    }).required(),
    billing_address: Joi.object({
      full_name: Joi.string().required(),
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postal_code: Joi.string().required(),
      country: Joi.string().required(),
      phone: Joi.string().optional(),
    }).optional(),
    payment_method: Joi.string().optional(),
    notes: Joi.string().optional(),
  }),

  updateOrderStatus: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').required(),
  }),
};

module.exports = {
  validate,
  validateParams,
  validateQuery,
  schemas,
};