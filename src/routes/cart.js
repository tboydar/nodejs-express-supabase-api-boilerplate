const express = require('express');
const cartController = require('../controllers/cart');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { cartValidation } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/v1/cart
 * @desc    Get user's cart items
 * @access  Private
 * @headers {string} Authorization - Bearer token
 */
router.get('/', 
  authenticate, 
  cartController.getCart
);

/**
 * @route   GET /api/v1/cart/summary
 * @desc    Get cart summary (totals only)
 * @access  Private
 * @headers {string} Authorization - Bearer token
 */
router.get('/summary', 
  authenticate, 
  cartController.getCartSummary
);

/**
 * @route   GET /api/v1/cart/count
 * @desc    Get cart item count (for header badge)
 * @access  Private
 * @headers {string} Authorization - Bearer token
 */
router.get('/count', 
  authenticate, 
  cartController.getCartCount
);

/**
 * @route   GET /api/v1/cart/validate
 * @desc    Validate cart items (check stock, availability, etc.)
 * @access  Private
 * @headers {string} Authorization - Bearer token
 */
router.get('/validate', 
  authenticate, 
  cartController.validateCart
);

/**
 * @route   POST /api/v1/cart
 * @desc    Add item to cart
 * @access  Private
 * @headers {string} Authorization - Bearer token
 * @body    {string} productId - Product UUID
 * @body    {number} quantity - Quantity to add (1-100)
 */
router.post('/', 
  authenticate,
  cartValidation.addToCart, 
  cartController.addToCart
);

/**
 * @route   PUT /api/v1/cart/:itemId
 * @desc    Update cart item quantity
 * @access  Private
 * @headers {string} Authorization - Bearer token
 * @param   {string} itemId - Cart item UUID
 * @body    {number} quantity - New quantity (1-100)
 */
router.put('/:itemId', 
  authenticate,
  cartValidation.updateCartItem, 
  cartController.updateCartItem
);

/**
 * @route   DELETE /api/v1/cart/:itemId
 * @desc    Remove item from cart
 * @access  Private
 * @headers {string} Authorization - Bearer token
 * @param   {string} itemId - Cart item UUID
 */
router.delete('/:itemId', 
  authenticate,
  cartValidation.removeFromCart, 
  cartController.removeFromCart
);

/**
 * @route   DELETE /api/v1/cart
 * @desc    Clear entire cart
 * @access  Private
 * @headers {string} Authorization - Bearer token
 */
router.delete('/', 
  authenticate, 
  cartController.clearCart
);

/**
 * @route   POST /api/v1/cart/merge
 * @desc    Merge guest cart with user cart (on login)
 * @access  Private
 * @headers {string} Authorization - Bearer token
 * @body    {array} guestCartItems - Array of guest cart items
 * @body    {string} guestCartItems[].productId - Product UUID
 * @body    {number} guestCartItems[].quantity - Item quantity
 */
router.post('/merge', 
  authenticate,
  cartValidation.mergeGuestCart, 
  cartController.mergeGuestCart
);

module.exports = router;