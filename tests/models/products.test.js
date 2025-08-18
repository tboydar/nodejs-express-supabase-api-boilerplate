const ProductModel = require('../../src/models/products');
const CategoryModel = require('../../src/models/categories');
const { testData } = require('../setup');
const { createTestCategory } = require('../helpers/database');

describe('ProductModel', () => {
  let testCategory;

  beforeEach(async () => {
    testCategory = await createTestCategory();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const productData = {
        ...testData.product,
        categoryId: testCategory.id
      };
      
      const product = await ProductModel.create(productData);
      
      expect(product).toBeDefined();
      expect(product.name).toBe(productData.name);
      expect(product.price).toBe(productData.price);
      expect(product.categoryId).toBe(testCategory.id);
      expect(product.id).toBeDefined();
      expect(product.createdAt).toBeDefined();
    });

    it('should create product without category', async () => {
      const productData = { ...testData.product };
      delete productData.categoryId;
      
      const product = await ProductModel.create(productData);
      
      expect(product.categoryId).toBeNull();
    });

    it('should generate unique SKU if not provided', async () => {
      const productData = { ...testData.product };
      delete productData.sku;
      
      const product = await ProductModel.create(productData);
      
      expect(product.sku).toBeDefined();
      expect(product.sku).toMatch(/^PROD-\d+$/);
    });
  });

  describe('findById', () => {
    it('should find product by id', async () => {
      const productData = {
        ...testData.product,
        categoryId: testCategory.id
      };
      const createdProduct = await ProductModel.create(productData);
      
      const product = await ProductModel.findById(createdProduct.id);
      
      expect(product).toBeDefined();
      expect(product.id).toBe(createdProduct.id);
      expect(product.name).toBe(productData.name);
    });

    it('should return null for non-existent id', async () => {
      const product = await ProductModel.findById('550e8400-e29b-41d4-a716-446655440000');
      expect(product).toBeNull();
    });
  });

  describe('findMany', () => {
    beforeEach(async () => {
      // Create multiple products for testing
      for (let i = 0; i < 10; i++) {
        await ProductModel.create({
          ...testData.product,
          name: `Product ${i}`,
          sku: `SKU-${i}`,
          price: (10 + i).toString(),
          categoryId: i % 2 === 0 ? testCategory.id : null
        });
      }
    });

    it('should return paginated products', async () => {
      const result = await ProductModel.findMany({ page: 1, limit: 5 });
      
      expect(result.data).toBeDefined();
      expect(result.data.length).toBe(5);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.totalPages).toBe(2);
    });

    it('should filter by category', async () => {
      const result = await ProductModel.findMany({ categoryId: testCategory.id });
      
      expect(result.data.length).toBe(5); // Half of the products
      result.data.forEach(product => {
        expect(product.categoryId).toBe(testCategory.id);
      });
    });

    it('should filter by active status', async () => {
      // Create an inactive product
      await ProductModel.create({
        ...testData.product,
        name: 'Inactive Product',
        sku: 'INACTIVE-SKU',
        isActive: false
      });
      
      const result = await ProductModel.findMany({ isActive: true });
      
      result.data.forEach(product => {
        expect(product.isActive).toBe(true);
      });
    });

    it('should search products by name', async () => {
      const result = await ProductModel.findMany({ search: 'Product 1' });
      
      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toBe('Product 1');
    });

    it('should filter by price range', async () => {
      const result = await ProductModel.findMany({
        minPrice: 12,
        maxPrice: 15
      });
      
      result.data.forEach(product => {
        const price = parseFloat(product.price);
        expect(price).toBeGreaterThanOrEqual(12);
        expect(price).toBeLessThanOrEqual(15);
      });
    });

    it('should sort products correctly', async () => {
      const result = await ProductModel.findMany({
        sortBy: 'price',
        sortOrder: 'asc'
      });
      
      for (let i = 1; i < result.data.length; i++) {
        const prevPrice = parseFloat(result.data[i - 1].price);
        const currPrice = parseFloat(result.data[i].price);
        expect(currPrice).toBeGreaterThanOrEqual(prevPrice);
      }
    });
  });

  describe('findByCategory', () => {
    it('should find products in specific category', async () => {
      const productData = {
        ...testData.product,
        categoryId: testCategory.id
      };
      await ProductModel.create(productData);
      
      const result = await ProductModel.findByCategory(testCategory.id);
      
      expect(result.data.length).toBe(1);
      expect(result.data[0].categoryId).toBe(testCategory.id);
    });

    it('should return empty array for category with no products', async () => {
      const emptyCategory = await createTestCategory({
        ...testData.category,
        name: 'Empty Category',
        slug: 'empty-category'
      });
      
      const result = await ProductModel.findByCategory(emptyCategory.id);
      
      expect(result.data.length).toBe(0);
    });
  });

  describe('update', () => {
    it('should update product fields', async () => {
      const product = await ProductModel.create(testData.product);
      
      const updateData = {
        name: 'Updated Product Name',
        price: '39.99',
        stockQuantity: 50
      };
      
      const updatedProduct = await ProductModel.update(product.id, updateData);
      
      expect(updatedProduct.name).toBe(updateData.name);
      expect(updatedProduct.price).toBe(updateData.price);
      expect(updatedProduct.stockQuantity).toBe(updateData.stockQuantity);
    });

    it('should return null for non-existent product', async () => {
      const result = await ProductModel.update(
        '550e8400-e29b-41d4-a716-446655440000',
        { name: 'Updated Name' }
      );
      
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete product', async () => {
      const product = await ProductModel.create(testData.product);
      
      const result = await ProductModel.delete(product.id);
      expect(result).toBe(true);
      
      // Verify product is deleted
      const foundProduct = await ProductModel.findById(product.id);
      expect(foundProduct).toBeNull();
    });

    it('should return false for non-existent product', async () => {
      const result = await ProductModel.delete('550e8400-e29b-41d4-a716-446655440000');
      expect(result).toBe(false);
    });
  });

  describe('updateStock', () => {
    it('should update product stock', async () => {
      const product = await ProductModel.create({
        ...testData.product,
        stockQuantity: 100
      });
      
      const updatedProduct = await ProductModel.updateStock(product.id, 75);
      
      expect(updatedProduct.stockQuantity).toBe(75);
    });

    it('should return null for non-existent product', async () => {
      const result = await ProductModel.updateStock(
        '550e8400-e29b-41d4-a716-446655440000',
        50
      );
      
      expect(result).toBeNull();
    });
  });

  describe('countByCategory', () => {
    it('should count products in category', async () => {
      // Create products in the test category
      for (let i = 0; i < 3; i++) {
        await ProductModel.create({
          ...testData.product,
          name: `Product ${i}`,
          sku: `SKU-${i}`,
          categoryId: testCategory.id
        });
      }
      
      const count = await ProductModel.countByCategory(testCategory.id);
      expect(count).toBe(3);
    });

    it('should return 0 for empty category', async () => {
      const emptyCategory = await createTestCategory({
        ...testData.category,
        name: 'Empty Category',
        slug: 'empty-category'
      });
      
      const count = await ProductModel.countByCategory(emptyCategory.id);
      expect(count).toBe(0);
    });
  });
});