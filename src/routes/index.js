const express = require('express');

// Import route modules
const authRoutes = require('./auth');
const productRoutes = require('./api/products');
const categoryRoutes = require('./api/categories');
const cartRoutes = require('./cart');
const orderRoutes = require('./orders');

const router = express.Router();

// API status endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'E-commerce API v1',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/auth',
      products: '/products',
      categories: '/categories',
      cart: '/cart',
      orders: '/orders',
    },
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);

module.exports = router;