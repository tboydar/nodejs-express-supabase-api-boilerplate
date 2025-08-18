const request = require('supertest');
const app = require('../../src/index');
const { testData } = require('../setup');
const { createTestUser, createTestAdmin, createAuthHeader } = require('../helpers/auth');
const { createTestCategory } = require('../helpers/database');

describe('Products API', () => {
  let userToken, adminToken;
  let testCategory;

  beforeEach(async () => {
    const userResult = await createTestUser();
    userToken = userResult.token;
    
    const adminResult = await createTestAdmin();
    adminToken = adminResult.token;
    
    testCategory = await createTestCategory();
  });

  describe('GET /api/v1/products', () => {
    beforeEach(async () => {
      // Create test products
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/products')
          .set('Authorization', createAuthHeader(adminToken))
          .send({
            ...testData.product,
            name: `Test Product ${i + 1}`,
            sku: `TEST-SKU-${String(i + 1).padStart(3, '0')}`,
            price: (20 + i * 5).toString(),
            categoryId: testCategory.id
          });
      }
    });

    it('should get all products', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBe(5);
      expect(response.body.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/products?page=1&limit=3')
        .expect(200);

      expect(response.body.data.length).toBe(3);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(3);
      expect(response.body.pagination.total).toBe(5);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get(`/api/v1/products?categoryId=${testCategory.id}`)
        .expect(200);

      expect(response.body.data.length).toBe(5);
      response.body.data.forEach(product => {
        expect(product.categoryId).toBe(testCategory.id);
      });
    });

    it('should search by name', async () => {
      const response = await request(app)
        .get('/api/v1/products?search=Product 1')
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Test Product 1');
    });

    it('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/v1/products?minPrice=25&maxPrice=35')
        .expect(200);

      response.body.data.forEach(product => {
        const price = parseFloat(product.price);
        expect(price).toBeGreaterThanOrEqual(25);
        expect(price).toBeLessThanOrEqual(35);
      });
    });

    it('should sort products', async () => {
      const response = await request(app)
        .get('/api/v1/products?sortBy=price&sortOrder=asc')
        .expect(200);

      for (let i = 1; i < response.body.data.length; i++) {
        const prevPrice = parseFloat(response.body.data[i - 1].price);
        const currPrice = parseFloat(response.body.data[i].price);
        expect(currPrice).toBeGreaterThanOrEqual(prevPrice);
      }
    });
  });

  describe('GET /api/v1/products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', createAuthHeader(adminToken))
        .send({
          ...testData.product,
          categoryId: testCategory.id
        });
      testProduct = response.body.data;
    });

    it('should get product by id', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${testProduct.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testProduct.id);
      expect(response.body.data.name).toBe(testData.product.name);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/v1/products/550e8400-e29b-41d4-a716-446655440000')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found');
    });
  });

  describe('POST /api/v1/products', () => {
    it('should create product as admin', async () => {
      const productData = {
        ...testData.product,
        categoryId: testCategory.id
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', createAuthHeader(adminToken))
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(productData.name);
      expect(response.body.data.price).toBe(productData.price);
      expect(response.body.data.categoryId).toBe(testCategory.id);
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', createAuthHeader(userToken))
        .send(testData.product)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .send(testData.product)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', createAuthHeader(adminToken))
        .send({
          name: 'Test Product'
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate price format', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', createAuthHeader(adminToken))
        .send({
          ...testData.product,
          price: 'invalid-price'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', createAuthHeader(adminToken))
        .send({
          ...testData.product,
          categoryId: testCategory.id
        });
      testProduct = response.body.data;
    });

    it('should update product as admin', async () => {
      const updateData = {
        name: 'Updated Product Name',
        price: '39.99'
      };

      const response = await request(app)
        .put(`/api/v1/products/${testProduct.id}`)
        .set('Authorization', createAuthHeader(adminToken))
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.price).toBe(updateData.price);
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .put(`/api/v1/products/${testProduct.id}`)
        .set('Authorization', createAuthHeader(userToken))
        .send({ name: 'Updated Name' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .put('/api/v1/products/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', createAuthHeader(adminToken))
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found');
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', createAuthHeader(adminToken))
        .send({
          ...testData.product,
          categoryId: testCategory.id
        });
      testProduct = response.body.data;
    });

    it('should delete product as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/${testProduct.id}`)
        .set('Authorization', createAuthHeader(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify product is deleted
      await request(app)
        .get(`/api/v1/products/${testProduct.id}`)
        .expect(404);
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/${testProduct.id}`)
        .set('Authorization', createAuthHeader(userToken))
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .delete('/api/v1/products/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', createAuthHeader(adminToken))
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/products/category/:categoryId', () => {
    beforeEach(async () => {
      // Create products in category
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/v1/products')
          .set('Authorization', createAuthHeader(adminToken))
          .send({
            ...testData.product,
            name: `Category Product ${i + 1}`,
            sku: `CAT-SKU-${String(i + 1).padStart(3, '0')}`,
            categoryId: testCategory.id
          });
      }
    });

    it('should get products by category', async () => {
      const response = await request(app)
        .get(`/api/v1/products/category/${testCategory.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
      response.body.data.forEach(product => {
        expect(product.categoryId).toBe(testCategory.id);
      });
    });

    it('should return empty array for category with no products', async () => {
      const emptyCategory = await createTestCategory({
        ...testData.category,
        name: 'Empty Category',
        slug: 'empty-category'
      });

      const response = await request(app)
        .get(`/api/v1/products/category/${emptyCategory.id}`)
        .expect(200);

      expect(response.body.data.length).toBe(0);
    });
  });
});