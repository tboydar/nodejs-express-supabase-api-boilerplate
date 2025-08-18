const Joi = require('joi');
const { body, param, query, validationResult } = require('express-validator');
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

// Express-validator middleware for handling validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
  }
  next();
};

// Express-validator validation rules
const productValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Product name is required')
      .isLength({ min: 1, max: 255 })
      .withMessage('Product name must be between 1 and 255 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must not exceed 2000 characters'),
    
    body('price')
      .isNumeric()
      .withMessage('Price must be a number')
      .custom((value) => {
        if (parseFloat(value) < 0) {
          throw new Error('Price must be positive');
        }
        return true;
      }),
    
    body('stockQuantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock quantity must be a non-negative integer'),
    
    body('categoryId')
      .optional()
      .isUUID()
      .withMessage('Category ID must be a valid UUID'),
    
    body('sku')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('SKU must not exceed 100 characters'),
    
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage('Image URL must be a valid URL'),
    
    body('images')
      .optional()
      .isArray()
      .withMessage('Images must be an array'),
    
    body('weight')
      .optional()
      .isNumeric()
      .withMessage('Weight must be a number')
      .custom((value) => {
        if (value && parseFloat(value) < 0) {
          throw new Error('Weight must be positive');
        }
        return true;
      }),
    
    handleValidationErrors
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Product name cannot be empty')
      .isLength({ min: 1, max: 255 })
      .withMessage('Product name must be between 1 and 255 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must not exceed 2000 characters'),
    
    body('price')
      .optional()
      .isNumeric()
      .withMessage('Price must be a number')
      .custom((value) => {
        if (value && parseFloat(value) < 0) {
          throw new Error('Price must be positive');
        }
        return true;
      }),
    
    body('stockQuantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock quantity must be a non-negative integer'),
    
    body('categoryId')
      .optional()
      .isUUID()
      .withMessage('Category ID must be a valid UUID'),
    
    body('sku')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('SKU must not exceed 100 characters'),
    
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage('Image URL must be a valid URL'),
    
    body('weight')
      .optional()
      .isNumeric()
      .withMessage('Weight must be a number')
      .custom((value) => {
        if (value && parseFloat(value) < 0) {
          throw new Error('Weight must be positive');
        }
        return true;
      }),
    
    handleValidationErrors
  ],

  paramId: [
    param('id')
      .isUUID()
      .withMessage('Product ID must be a valid UUID'),
    handleValidationErrors
  ],

  query: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('sort')
      .optional()
      .isIn(['newest', 'oldest', 'name_asc', 'name_desc', 'price_asc', 'price_desc'])
      .withMessage('Sort must be one of: newest, oldest, name_asc, name_desc, price_asc, price_desc'),
    
    handleValidationErrors
  ]
};

const categoryValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Category name is required')
      .isLength({ min: 1, max: 255 })
      .withMessage('Category name must be between 1 and 255 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage('Image URL must be a valid URL'),
    
    handleValidationErrors
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Category name cannot be empty')
      .isLength({ min: 1, max: 255 })
      .withMessage('Category name must be between 1 and 255 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage('Image URL must be a valid URL'),
    
    handleValidationErrors
  ],

  paramId: [
    param('id')
      .isUUID()
      .withMessage('Category ID must be a valid UUID'),
    handleValidationErrors
  ]
};

// Auth validation rules
const authValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Full name must be between 1 and 100 characters'),
    
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    
    handleValidationErrors
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    handleValidationErrors
  ],

  refreshToken: [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required'),
    
    handleValidationErrors
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    handleValidationErrors
  ],

  updateProfile: [
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Full name must be between 1 and 100 characters'),
    
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    
    handleValidationErrors
  ]
};

// Cart validation rules
const cartValidation = {
  addToCart: [
    body('productId')
      .isUUID()
      .withMessage('Product ID must be a valid UUID'),
    
    body('quantity')
      .isInt({ min: 1, max: 100 })
      .withMessage('Quantity must be between 1 and 100'),
    
    handleValidationErrors
  ],

  updateCartItem: [
    param('itemId')
      .isUUID()
      .withMessage('Cart item ID must be a valid UUID'),
    
    body('quantity')
      .isInt({ min: 1, max: 100 })
      .withMessage('Quantity must be between 1 and 100'),
    
    handleValidationErrors
  ],

  removeFromCart: [
    param('itemId')
      .isUUID()
      .withMessage('Cart item ID must be a valid UUID'),
    
    handleValidationErrors
  ],

  mergeGuestCart: [
    body('guestCartItems')
      .isArray({ min: 1 })
      .withMessage('Guest cart items must be a non-empty array'),
    
    body('guestCartItems.*.productId')
      .isUUID()
      .withMessage('Each cart item must have a valid product ID'),
    
    body('guestCartItems.*.quantity')
      .isInt({ min: 1, max: 100 })
      .withMessage('Each cart item quantity must be between 1 and 100'),
    
    handleValidationErrors
  ]
};

module.exports = {
  validate,
  validateParams,
  validateQuery,
  schemas,
  handleValidationErrors,
  productValidation,
  categoryValidation,
  authValidation,
  cartValidation
};