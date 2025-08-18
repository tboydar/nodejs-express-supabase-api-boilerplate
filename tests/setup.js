// Test setup and teardown
const { db } = require('../src/config/drizzle');
const { 
  users, 
  categories, 
  products, 
  productTranslations, 
  categoryTranslations,
  cart,
  orders,
  orderItems
} = require('../src/models/schema');

// Setup test database before all tests
beforeAll(async () => {
  // Clean up all tables before running tests
  await cleanupDatabase();
});

// Clean up after each test
afterEach(async () => {
  await cleanupDatabase();
});

// Close database connection after all tests
afterAll(async () => {
  // Add any cleanup needed here
});

// Helper function to clean up database
async function cleanupDatabase() {
  try {
    // Delete in reverse order of dependencies
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(cart);
    await db.delete(productTranslations);
    await db.delete(categoryTranslations);
    await db.delete(products);
    await db.delete(categories);
    await db.delete(users);
  } catch (error) {
    console.error('Error cleaning up database:', error);
  }
}

// Test data factories
const testData = {
  user: {
    email: 'test@example.com',
    password: 'password123',
    fullName: 'Test User',
    phone: '+1234567890',
    role: 'user',
    isEmailVerified: true,
    isActive: true
  },
  
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
    fullName: 'Admin User',
    phone: '+1234567891',
    role: 'admin',
    isEmailVerified: true,
    isActive: true
  },
  
  category: {
    name: 'Test Category',
    description: 'Test category description',
    slug: 'test-category',
    imageUrl: 'https://example.com/category.jpg',
    isActive: true,
    sortOrder: 1
  },
  
  product: {
    name: 'Test Product',
    description: 'Test product description',
    price: '29.99',
    comparePrice: '39.99',
    sku: 'TEST-SKU-001',
    stockQuantity: 100,
    imageUrl: 'https://example.com/product.jpg',
    images: ['https://example.com/product1.jpg', 'https://example.com/product2.jpg'],
    weight: 1.5,
    dimensions: '10x10x5',
    isActive: true,
    isFeatured: false
  },
  
  cartItem: {
    quantity: 2
  },
  
  order: {
    orderNumber: 'ORD-TEST-001',
    status: 'pending',
    totalAmount: '59.98',
    shippingAddress: JSON.stringify({
      fullName: 'Test User',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345',
      country: 'US',
      phone: '+1234567890'
    }),
    billingAddress: JSON.stringify({
      fullName: 'Test User',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345',
      country: 'US',
      phone: '+1234567890'
    }),
    paymentMethod: 'credit_card',
    paymentStatus: 'pending',
    notes: 'Test order notes'
  },
  
  orderItem: {
    quantity: 2,
    price: '29.99',
    productName: 'Test Product',
    productImage: 'https://example.com/product.jpg'
  }
};

// Export test utilities
module.exports = {
  cleanupDatabase,
  testData
};