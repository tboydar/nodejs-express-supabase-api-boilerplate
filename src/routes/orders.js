const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');
const OrdersController = require('../controllers/orders');

// Order status validation
const orderStatusValidation = body('status')
  .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
  .withMessage('Invalid order status');

// Payment status validation
const paymentStatusValidation = body('paymentStatus')
  .isIn(['pending', 'paid', 'failed', 'refunded'])
  .withMessage('Invalid payment status');

// Address validation
const addressValidation = [
  body('shippingAddress.fullName').notEmpty().withMessage('Full name is required'),
  body('shippingAddress.address').notEmpty().withMessage('Address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.postalCode').notEmpty().withMessage('Postal code is required'),
  body('shippingAddress.country').notEmpty().withMessage('Country is required'),
  body('shippingAddress.phone').optional().isMobilePhone(),
];

// Create order validation
const createOrderValidation = [
  ...addressValidation,
  body('billingAddress').optional(),
  body('paymentMethod').optional().isString(),
  body('notes').optional().isString().isLength({ max: 500 })
];

// Update order validation
const updateOrderValidation = [
  body('shippingAddress').optional(),
  body('billingAddress').optional(),
  body('paymentMethod').optional().isString(),
  body('notes').optional().isString().isLength({ max: 500 }),
  body('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  body('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded'])
];

// Query validation for filtering orders
const orderQueryValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'totalAmount', 'status']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('userId').optional().isUUID()
];

// ID parameter validation
const idValidation = param('id').isUUID().withMessage('Invalid order ID');
const orderNumberValidation = param('orderNumber').isString().notEmpty().withMessage('Invalid order number');

// Routes

// Get user's orders (authenticated users)
router.get('/', 
  authenticate, 
  orderQueryValidation,
  validate,
  OrdersController.getUserOrders
);

// Get user's recent orders
router.get('/recent', 
  authenticate,
  query('limit').optional().isInt({ min: 1, max: 20 }).toInt(),
  validate,
  OrdersController.getRecentOrders
);

// Get order statistics
router.get('/stats',
  authenticate,
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('userId').optional().isUUID(),
  validate,
  OrdersController.getOrderStats
);

// Create new order from cart
router.post('/',
  authenticate,
  createOrderValidation,
  validate,
  OrdersController.createOrder
);

// Get specific order by ID
router.get('/:id',
  authenticate,
  idValidation,
  validate,
  OrdersController.getOrder
);

// Get order by order number
router.get('/number/:orderNumber',
  authenticate,
  orderNumberValidation,
  validate,
  OrdersController.getOrderByNumber
);

// Update order (limited fields for users, more for admins)
router.put('/:id',
  authenticate,
  idValidation,
  updateOrderValidation,
  validate,
  OrdersController.updateOrder
);

// Cancel order
router.delete('/:id',
  authenticate,
  idValidation,
  validate,
  OrdersController.cancelOrder
);

// Check if user can review order
router.get('/:id/can-review',
  authenticate,
  idValidation,
  validate,
  OrdersController.canReviewOrder
);

// Admin-only routes
// Get all orders (admin only)
router.get('/admin/all',
  authenticate,
  authorize('admin'),
  orderQueryValidation,
  validate,
  OrdersController.getAllOrders
);

// Update order status (admin only)
router.patch('/admin/:id/status',
  authenticate,
  authorize('admin'),
  idValidation,
  orderStatusValidation,
  validate,
  OrdersController.updateOrderStatus
);

// Update payment status (admin only)
router.patch('/admin/:id/payment-status',
  authenticate,
  authorize('admin'),
  idValidation,
  paymentStatusValidation,
  validate,
  OrdersController.updatePaymentStatus
);

module.exports = router;