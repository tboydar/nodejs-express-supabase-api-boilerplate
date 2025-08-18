const express = require('express');
const categoriesController = require('../../controllers/categories');
const { categoryValidation } = require('../../middleware/validation');
const { authenticate, requireAdmin, optionalAuth } = require('../../middleware/auth');
const router = express.Router();

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories with pagination
 * @access  Public
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20, max: 100)
 * @query   {boolean} isActive - Filter by active status (default: true)
 * @query   {string} fields - Comma-separated fields to include
 */
router.get('/', categoriesController.getCategories);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get category by ID
 * @access  Public
 * @param   {string} id - Category UUID
 */
router.get('/:id', categoryValidation.paramId, categoriesController.getCategory);

/**
 * @route   GET /api/v1/categories/:id/products
 * @desc    Get category with its products
 * @access  Public
 * @param   {string} id - Category UUID
 * @query   {number} page - Page number for products (default: 1)
 * @query   {number} limit - Products per page (default: 12)
 * @query   {string} sort - Sort order for products
 */
router.get('/:id/products', 
  categoryValidation.paramId, 
  categoriesController.getCategoryWithProducts
);

/**
 * @route   GET /api/v1/categories/:id/stats
 * @desc    Get category statistics
 * @access  Public
 * @param   {string} id - Category UUID
 */
router.get('/:id/stats', 
  categoryValidation.paramId, 
  categoriesController.getCategoryStats
);

/**
 * @route   POST /api/v1/categories
 * @desc    Create new category
 * @access  Private (Admin only)
 * @body    {object} Category data
 */
router.post('/', 
  authenticate, 
  requireAdmin, 
  categoryValidation.create, 
  categoriesController.createCategory
);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update category
 * @access  Private (Admin only)
 * @param   {string} id - Category UUID
 * @body    {object} Category data
 */
router.put('/:id', 
  authenticate,
  requireAdmin,
  categoryValidation.paramId, 
  categoryValidation.update, 
  categoriesController.updateCategory
);

/**
 * @route   PATCH /api/v1/categories/:id/status
 * @desc    Toggle category active status
 * @access  Private (Admin only)
 * @param   {string} id - Category UUID
 */
router.patch('/:id/status', 
  authenticate,
  requireAdmin,
  categoryValidation.paramId, 
  categoriesController.toggleCategoryStatus
);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete category
 * @access  Private (Admin only)
 * @param   {string} id - Category UUID
 */
router.delete('/:id', 
  authenticate,
  requireAdmin,
  categoryValidation.paramId, 
  categoriesController.deleteCategory
);

module.exports = router;