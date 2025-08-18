const CartModel = require('../../src/models/cart');
const ProductModel = require('../../src/models/products');
const UserModel = require('../../src/models/users');
const { testData } = require('../setup');
const { createTestUser } = require('../helpers/auth');
const { createTestCategory, createTestProduct } = require('../helpers/database');

describe('CartModel', () => {
  let testUser;
  let testProduct;

  beforeEach(async () => {
    const userResult = await createTestUser();
    testUser = userResult.user;
    
    const category = await createTestCategory();
    testProduct = await createTestProduct(category.id);
  });

  describe('addItem', () => {
    it('should add new item to cart', async () => {
      const cartItem = await CartModel.addItem(testUser.id, testProduct.id, 2);
      
      expect(cartItem).toBeDefined();
      expect(cartItem.userId).toBe(testUser.id);
      expect(cartItem.productId).toBe(testProduct.id);
      expect(cartItem.quantity).toBe(2);
    });

    it('should update quantity for existing item', async () => {
      // Add item first time
      await CartModel.addItem(testUser.id, testProduct.id, 2);
      
      // Add same item again
      const cartItem = await CartModel.addItem(testUser.id, testProduct.id, 3);
      
      expect(cartItem.quantity).toBe(5); // 2 + 3
    });

    it('should not exceed available stock', async () => {
      // Product has 100 stock by default
      await expect(
        CartModel.addItem(testUser.id, testProduct.id, 150)
      ).rejects.toThrow('Insufficient stock');
    });
  });

  describe('getCartItems', () => {
    it('should get cart items with product details', async () => {
      await CartModel.addItem(testUser.id, testProduct.id, 2);
      
      const cartItems = await CartModel.getCartItems(testUser.id);
      
      expect(cartItems).toBeDefined();
      expect(cartItems.length).toBe(1);
      expect(cartItems[0].quantity).toBe(2);
      expect(cartItems[0].product).toBeDefined();
      expect(cartItems[0].product.name).toBe(testProduct.name);
    });

    it('should return empty array for empty cart', async () => {
      const cartItems = await CartModel.getCartItems(testUser.id);
      expect(cartItems).toEqual([]);
    });
  });

  describe('getCartSummary', () => {
    it('should calculate cart summary correctly', async () => {
      await CartModel.addItem(testUser.id, testProduct.id, 2);
      
      const summary = await CartModel.getCartSummary(testUser.id);
      
      expect(summary).toBeDefined();
      expect(summary.itemCount).toBe(1);
      expect(summary.totalQuantity).toBe(2);
      expect(summary.totalAmount).toBe((parseFloat(testProduct.price) * 2).toFixed(2));
    });

    it('should return zero summary for empty cart', async () => {
      const summary = await CartModel.getCartSummary(testUser.id);
      
      expect(summary.itemCount).toBe(0);
      expect(summary.totalQuantity).toBe(0);
      expect(summary.totalAmount).toBe('0.00');
    });
  });

  describe('updateItemQuantity', () => {
    it('should update item quantity', async () => {
      const cartItem = await CartModel.addItem(testUser.id, testProduct.id, 2);
      
      const updatedItem = await CartModel.updateItemQuantity(cartItem.id, 5);
      
      expect(updatedItem.quantity).toBe(5);
    });

    it('should not exceed available stock', async () => {
      const cartItem = await CartModel.addItem(testUser.id, testProduct.id, 2);
      
      await expect(
        CartModel.updateItemQuantity(cartItem.id, 150)
      ).rejects.toThrow('Insufficient stock');
    });

    it('should return null for non-existent item', async () => {
      const result = await CartModel.updateItemQuantity(
        '550e8400-e29b-41d4-a716-446655440000',
        5
      );
      
      expect(result).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      const cartItem = await CartModel.addItem(testUser.id, testProduct.id, 2);
      
      const result = await CartModel.removeItem(cartItem.id);
      expect(result).toBe(true);
      
      // Verify item is removed
      const cartItems = await CartModel.getCartItems(testUser.id);
      expect(cartItems.length).toBe(0);
    });

    it('should return false for non-existent item', async () => {
      const result = await CartModel.removeItem('550e8400-e29b-41d4-a716-446655440000');
      expect(result).toBe(false);
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      // Add multiple items
      await CartModel.addItem(testUser.id, testProduct.id, 2);
      
      const category2 = await createTestCategory({
        ...testData.category,
        name: 'Test Category 2',
        slug: 'test-category-2'
      });
      const product2 = await createTestProduct(category2.id, {
        ...testData.product,
        name: 'Test Product 2',
        sku: 'TEST-SKU-002'
      });
      await CartModel.addItem(testUser.id, product2.id, 1);
      
      const result = await CartModel.clearCart(testUser.id);
      expect(result).toBe(true);
      
      // Verify cart is empty
      const cartItems = await CartModel.getCartItems(testUser.id);
      expect(cartItems.length).toBe(0);
    });
  });

  describe('validateCartItems', () => {
    it('should validate available cart items', async () => {
      await CartModel.addItem(testUser.id, testProduct.id, 2);
      
      const validation = await CartModel.validateCartItems(testUser.id);
      
      expect(validation.isValid).toBe(true);
      expect(validation.invalidItems).toEqual([]);
    });

    it('should detect items with insufficient stock', async () => {
      // Add item to cart
      await CartModel.addItem(testUser.id, testProduct.id, 50);
      
      // Manually reduce product stock to create insufficient stock scenario
      await ProductModel.updateStock(testProduct.id, 10);
      
      const validation = await CartModel.validateCartItems(testUser.id);
      
      expect(validation.isValid).toBe(false);
      expect(validation.invalidItems.length).toBe(1);
      expect(validation.invalidItems[0].reason).toBe('insufficient_stock');
    });

    it('should detect inactive products', async () => {
      await CartModel.addItem(testUser.id, testProduct.id, 2);
      
      // Deactivate product
      await ProductModel.update(testProduct.id, { isActive: false });
      
      const validation = await CartModel.validateCartItems(testUser.id);
      
      expect(validation.isValid).toBe(false);
      expect(validation.invalidItems.length).toBe(1);
      expect(validation.invalidItems[0].reason).toBe('product_inactive');
    });
  });

  describe('getItemCount', () => {
    it('should return correct item count', async () => {
      await CartModel.addItem(testUser.id, testProduct.id, 2);
      
      const category2 = await createTestCategory({
        ...testData.category,
        name: 'Test Category 2',
        slug: 'test-category-2'
      });
      const product2 = await createTestProduct(category2.id, {
        ...testData.product,
        name: 'Test Product 2',
        sku: 'TEST-SKU-002'
      });
      await CartModel.addItem(testUser.id, product2.id, 3);
      
      const count = await CartModel.getItemCount(testUser.id);
      expect(count).toBe(5); // 2 + 3 total quantity
    });

    it('should return 0 for empty cart', async () => {
      const count = await CartModel.getItemCount(testUser.id);
      expect(count).toBe(0);
    });
  });

  describe('mergeGuestCart', () => {
    it('should merge guest cart with user cart', async () => {
      // Add item to user cart
      await CartModel.addItem(testUser.id, testProduct.id, 1);
      
      // Create another product for guest cart
      const category2 = await createTestCategory({
        ...testData.category,
        name: 'Test Category 2',
        slug: 'test-category-2'
      });
      const product2 = await createTestProduct(category2.id, {
        ...testData.product,
        name: 'Test Product 2',
        sku: 'TEST-SKU-002'
      });
      
      const guestCartItems = [
        { productId: testProduct.id, quantity: 2 }, // Same product, should merge
        { productId: product2.id, quantity: 1 }     // New product, should add
      ];
      
      const result = await CartModel.mergeGuestCart(testUser.id, guestCartItems);
      expect(result).toBe(true);
      
      const cartItems = await CartModel.getCartItems(testUser.id);
      expect(cartItems.length).toBe(2);
      
      // Find the merged item
      const mergedItem = cartItems.find(item => item.productId === testProduct.id);
      expect(mergedItem.quantity).toBe(3); // 1 + 2
    });

    it('should handle invalid products in guest cart', async () => {
      const guestCartItems = [
        { productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 } // Non-existent product
      ];
      
      const result = await CartModel.mergeGuestCart(testUser.id, guestCartItems);
      expect(result).toBe(true); // Should not fail
      
      const cartItems = await CartModel.getCartItems(testUser.id);
      expect(cartItems.length).toBe(0); // Invalid items should be skipped
    });
  });
});