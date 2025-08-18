const request = require('supertest');
const app = require('../../src/index');
const { testData } = require('../setup');
const { createTestUser, createTestAdmin, createAuthHeader } = require('../helpers/auth');
const { createTestCategory, createTestProduct } = require('../helpers/database');

describe('Cart API', () => {
  let userToken, adminToken;
  let testUser, testProduct;

  beforeEach(async () => {
    const userResult = await createTestUser();
    testUser = userResult.user;
    userToken = userResult.token;
    
    const adminResult = await createTestAdmin();
    adminToken = adminResult.token;
    
    const category = await createTestCategory();
    testProduct = await createTestProduct(category.id);
  });

  describe('POST /api/v1/cart', () => {
    it('should add item to cart', async () => {
      const response = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', createAuthHeader(userToken))
        .send({
          productId: testProduct.id,
          quantity: 2
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.productId).toBe(testProduct.id);
      expect(response.body.data.quantity).toBe(2);
    });

    it('should update quantity for existing item', async () => {
      // Add item first time
      await request(app)
        .post('/api/v1/cart')
        .set('Authorization', createAuthHeader(userToken))
        .send({
          productId: testProduct.id,
          quantity: 2
        });

      // Add same item again
      const response = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', createAuthHeader(userToken))
        .send({
          productId: testProduct.id,
          quantity: 3
        })
        .expect(201);

      expect(response.body.data.quantity).toBe(5); // 2 + 3
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/cart')
        .send({
          productId: testProduct.id,
          quantity: 2
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate product exists', async () => {
      const response = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', createAuthHeader(userToken))
        .send({
          productId: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 2
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found');
    });

    it('should validate quantity', async () => {
      const response = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', createAuthHeader(userToken))
        .send({
          productId: testProduct.id,
          quantity: 0
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should check stock availability', async () => {
      const response = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', createAuthHeader(userToken))
        .send({
          productId: testProduct.id,
          quantity: 200 // Exceeds stock (100)
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Insufficient stock');
    });
  });

  describe('GET /api/v1/cart', () => {
    beforeEach(async () => {
      // Add items to cart
      await request(app)
        .post('/api/v1/cart')
        .set('Authorization', createAuthHeader(userToken))
        .send({
          productId: testProduct.id,
          quantity: 2
        });
    });

    it('should get cart items', async () => {
      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', createAuthHeader(userToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeDefined();
      expect(response.body.data.items.length).toBe(1);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.itemCount).toBe(1);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/cart')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return empty cart for user with no items', async () => {
      const newUserResult = await createTestUser({
        ...testData.user,
        email: 'newuser@example.com'
      });

      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', createAuthHeader(newUserResult.token))
        .expect(200);

      expect(response.body.data.items.length).toBe(0);
      expect(response.body.data.summary.itemCount).toBe(0);
    });
  });

  describe('PUT /api/v1/cart/:id', () => {
    let cartItem;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', createAuthHeader(userToken))
        .send({
          productId: testProduct.id,
          quantity: 2
        });
      cartItem = response.body.data;
    });

    it('should update cart item quantity', async () => {
      const response = await request(app)
        .put(`/api/v1/cart/${cartItem.id}`)
        .set('Authorization', createAuthHeader(userToken))
        .send({ quantity: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(5);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/cart/${cartItem.id}`)
        .send({ quantity: 5 })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .put('/api/v1/cart/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', createAuthHeader(userToken))
        .send({ quantity: 5 })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should validate quantity', async () => {
      const response = await request(app)
        .put(`/api/v1/cart/${cartItem.id}`)
        .set('Authorization', createAuthHeader(userToken))
        .send({ quantity: 0 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should check stock availability', async () => {
      const response = await request(app)
        .put(`/api/v1/cart/${cartItem.id}`)
        .set('Authorization', createAuthHeader(userToken))
        .send({ quantity: 200 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Insufficient stock');
    });
  });

  describe('DELETE /api/v1/cart/:id', () => {
    let cartItem;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', createAuthHeader(userToken))
        .send({
          productId: testProduct.id,
          quantity: 2
        });
      cartItem = response.body.data;
    });

    it('should remove cart item', async () => {
      const response = await request(app)
        .delete(`/api/v1/cart/${cartItem.id}`)
        .set('Authorization', createAuthHeader(userToken))
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify item is removed
      const cartResponse = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', createAuthHeader(userToken));

      expect(cartResponse.body.data.items.length).toBe(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/cart/${cartItem.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .delete('/api/v1/cart/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', createAuthHeader(userToken))
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/cart', () => {
    beforeEach(async () => {
      // Add multiple items to cart
      await request(app)
        .post('/api/v1/cart')
        .set('Authorization', createAuthHeader(userToken))
        .send({
          productId: testProduct.id,
          quantity: 2
        });
    });

    it('should clear cart', async () => {
      const response = await request(app)
        .delete('/api/v1/cart')
        .set('Authorization', createAuthHeader(userToken))
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify cart is empty
      const cartResponse = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', createAuthHeader(userToken));

      expect(cartResponse.body.data.items.length).toBe(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/v1/cart')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/cart/count', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/cart')
        .set('Authorization', createAuthHeader(userToken))
        .send({
          productId: testProduct.id,
          quantity: 3
        });
    });

    it('should get cart item count', async () => {
      const response = await request(app)
        .get('/api/v1/cart/count')
        .set('Authorization', createAuthHeader(userToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(3);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/cart/count')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/cart/validate', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/cart')
        .set('Authorization', createAuthHeader(userToken))
        .send({
          productId: testProduct.id,
          quantity: 2
        });
    });

    it('should validate cart items', async () => {
      const response = await request(app)
        .get('/api/v1/cart/validate')
        .set('Authorization', createAuthHeader(userToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.invalidItems).toEqual([]);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/cart/validate')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/cart/merge', () => {
    it('should merge guest cart items', async () => {
      // Add item to user cart first
      await request(app)
        .post('/api/v1/cart')
        .set('Authorization', createAuthHeader(userToken))
        .send({
          productId: testProduct.id,
          quantity: 1
        });

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

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', createAuthHeader(userToken))
        .send({ guestCartItems })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify cart has merged items
      const cartResponse = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', createAuthHeader(userToken));

      expect(cartResponse.body.data.items.length).toBe(2);
      
      // Find the merged item
      const mergedItem = cartResponse.body.data.items.find(
        item => item.productId === testProduct.id
      );
      expect(mergedItem.quantity).toBe(3); // 1 + 2
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/cart/merge')
        .send({ guestCartItems: [] })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate guest cart items format', async () => {
      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', createAuthHeader(userToken))
        .send({ guestCartItems: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});