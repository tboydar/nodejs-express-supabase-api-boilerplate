// Simple API test server for testing product management endpoints
const express = require('express');
const productsRouter = require('./src/routes/api/products');
const categoriesRouter = require('./src/routes/api/categories');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add basic language support for testing
app.use((req, res, next) => {
  req.language = req.headers['accept-language'] || 'en';
  next();
});

// Mount API routes
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/categories', categoriesRouter);

// Basic health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API Test Server Running',
    timestamp: new Date().toISOString(),
    endpoints: {
      products: '/api/v1/products',
      categories: '/api/v1/categories'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 API Test Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Products API: http://localhost:${PORT}/api/v1/products`);
  console.log(`📋 Categories API: http://localhost:${PORT}/api/v1/categories`);
  console.log('\n⚠️  Note: Database is not connected - this is for API structure testing only');
});

module.exports = app;