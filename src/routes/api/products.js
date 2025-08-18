const express = require('express');
const productsController = require('../../controllers/products');
const { productValidation } = require('../../middleware/validation');
const { authenticate, requireAdmin, optionalAuth } = require('../../middleware/auth');
const router = express.Router();

/**
 * @route   GET /api/v1/products
 * @desc    Get all products with pagination and filters
 * @access  Public
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 12, max: 100)
 * @query   {string} q - Search query
 * @query   {string} category - Category ID filter
 * @query   {string} sort - Sort order (newest, name_asc, name_desc, price_asc, price_desc)
 * @query   {number} minPrice - Minimum price filter
 * @query   {number} maxPrice - Maximum price filter
 * @query   {boolean} isActive - Filter by active status (default: true)
 * @query   {string} fields - Comma-separated fields to include
 */
router.get('/', optionalAuth, productValidation.query, productsController.getProducts);

/**
 * @route   GET /api/v1/products/search
 * @desc    Search products by query
 * @access  Public
 * @query   {string} q - Search query (required)
 * @query   {number} limit - Number of results (default: 10, max: 50)
 */
router.get('/search', productsController.searchProducts);

/**
 * @route   GET /api/v1/products/category/:categoryId
 * @desc    Get products by category
 * @access  Public
 * @param   {string} categoryId - Category UUID
 */
router.get('/category/:categoryId', productsController.getProductsByCategory);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get product by ID
 * @access  Public
 * @param   {string} id - Product UUID
 */
router.get('/:id', productValidation.paramId, productsController.getProduct);

/**
 * @route   POST /api/v1/products
 * @desc    Create new product
 * @access  Private (Admin only)
 * @body    {object} Product data
 */
router.post('/', 
  authenticate, 
  requireAdmin, 
  productValidation.create, 
  productsController.createProduct
);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update product
 * @access  Private (Admin only)
 * @param   {string} id - Product UUID
 * @body    {object} Product data
 */
router.put('/:id', 
  authenticate,
  requireAdmin,
  productValidation.paramId, 
  productValidation.update, 
  productsController.updateProduct
);

/**
 * @route   PATCH /api/v1/products/:id/status
 * @desc    Toggle product active status
 * @access  Private (Admin only)
 * @param   {string} id - Product UUID
 */
router.patch('/:id/status', 
  authenticate,
  requireAdmin,
  productValidation.paramId, 
  productsController.toggleProductStatus
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete product
 * @access  Private (Admin only)
 * @param   {string} id - Product UUID
 */
router.delete('/:id', 
  authenticate,
  requireAdmin,
  productValidation.paramId, 
  productsController.deleteProduct
);

module.exports = router;