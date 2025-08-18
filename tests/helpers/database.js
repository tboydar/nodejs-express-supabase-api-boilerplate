// Database test helpers
const CategoryModel = require('../../src/models/categories');
const ProductModel = require('../../src/models/products');
const CartModel = require('../../src/models/cart');
const OrderModel = require('../../src/models/orders');
const { testData } = require('../setup');

// Create test category
async function createTestCategory(data = testData.category) {
  return await CategoryModel.create(data);
}

// Create test product
async function createTestProduct(categoryId = null, data = testData.product) {
  const productData = categoryId ? { ...data, categoryId } : data;
  return await ProductModel.create(productData);
}

// Create test cart item
async function createTestCartItem(userId, productId, data = testData.cartItem) {
  return await CartModel.addItem(userId, productId, data.quantity);
}

// Create test order
async function createTestOrder(userId, data = testData.order) {
  // First create some cart items
  const category = await createTestCategory();
  const product = await createTestProduct(category.id);
  await createTestCartItem(userId, product.id);
  
  // Get cart items for order creation
  const cartItems = await CartModel.getCartItems(userId);
  
  return await OrderModel.createOrder(userId, data, cartItems);
}

// Create multiple test products
async function createMultipleProducts(count = 5, categoryId = null) {
  const products = [];
  
  for (let i = 0; i < count; i++) {
    const productData = {
      ...testData.product,
      name: `Test Product ${i + 1}`,
      sku: `TEST-SKU-${String(i + 1).padStart(3, '0')}`,
      price: (Math.random() * 100 + 10).toFixed(2)
    };
    
    if (categoryId) {
      productData.categoryId = categoryId;
    }
    
    const product = await ProductModel.create(productData);
    products.push(product);
  }
  
  return products;
}

// Create multiple test categories
async function createMultipleCategories(count = 3) {
  const categories = [];
  
  for (let i = 0; i < count; i++) {
    const categoryData = {
      ...testData.category,
      name: `Test Category ${i + 1}`,
      slug: `test-category-${i + 1}`,
      sortOrder: i + 1
    };
    
    const category = await CategoryModel.create(categoryData);
    categories.push(category);
  }
  
  return categories;
}

module.exports = {
  createTestCategory,
  createTestProduct,
  createTestCartItem,
  createTestOrder,
  createMultipleProducts,
  createMultipleCategories
};