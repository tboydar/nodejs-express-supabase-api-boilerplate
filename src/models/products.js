const { eq, like, and, or, desc, asc, count, sql } = require('drizzle-orm');
const { db } = require('../config/drizzle');
const { products, categories } = require('./schema');

class ProductModel {
  // Get all products with optional filtering and pagination
  static async findMany({
    page = 1,
    limit = 10,
    search,
    categoryId,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    isActive = true,
  } = {}) {
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    
    if (isActive !== undefined) {
      whereConditions.push(eq(products.isActive, isActive));
    }
    
    if (search) {
      whereConditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.description, `%${search}%`),
          like(products.sku, `%${search}%`)
        )
      );
    }
    
    if (categoryId) {
      whereConditions.push(eq(products.categoryId, categoryId));
    }
    
    if (minPrice !== undefined) {
      whereConditions.push(sql`${products.price} >= ${minPrice}`);
    }
    
    if (maxPrice !== undefined) {
      whereConditions.push(sql`${products.price} <= ${maxPrice}`);
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    // Sort configuration
    const orderBy = sortOrder === 'desc' ? desc(products[sortBy]) : asc(products[sortBy]);
    
    // Get products with category information
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        stockQuantity: products.stockQuantity,
        categoryId: products.categoryId,
        imageUrl: products.imageUrl,
        images: products.images,
        sku: products.sku,
        isActive: products.isActive,
        weight: products.weight,
        dimensions: products.dimensions,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);
    
    // Get total count for pagination
    const [{ total }] = await db
      .select({ total: count() })
      .from(products)
      .where(whereClause);
    
    return {
      data: result,
      pagination: {
        page,
        limit,
        total: Number(total),
        pages: Math.ceil(Number(total) / limit),
      },
    };
  }
  
  // Get single product by ID
  static async findById(id) {
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        stockQuantity: products.stockQuantity,
        categoryId: products.categoryId,
        imageUrl: products.imageUrl,
        images: products.images,
        sku: products.sku,
        isActive: products.isActive,
        weight: products.weight,
        dimensions: products.dimensions,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id))
      .limit(1);
    
    return result[0] || null;
  }
  
  // Get product by SKU
  static async findBySku(sku) {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.sku, sku))
      .limit(1);
    
    return result[0] || null;
  }
  
  // Create new product
  static async create(productData) {
    const result = await db
      .insert(products)
      .values({
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return result[0];
  }
  
  // Update product
  static async update(id, updateData) {
    const result = await db
      .update(products)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    
    return result[0] || null;
  }
  
  // Delete product (soft delete by setting isActive to false)
  static async delete(id) {
    const result = await db
      .update(products)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    
    return result[0] || null;
  }
  
  // Hard delete product
  static async hardDelete(id) {
    const result = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    
    return result[0] || null;
  }
  
  // Update stock quantity
  static async updateStock(id, quantity) {
    const result = await db
      .update(products)
      .set({
        stockQuantity: quantity,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    
    return result[0] || null;
  }
  
  // Decrease stock (for orders)
  static async decreaseStock(id, quantity) {
    const result = await db
      .update(products)
      .set({
        stockQuantity: sql`${products.stockQuantity} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(products.id, id),
        sql`${products.stockQuantity} >= ${quantity}`
      ))
      .returning();
    
    return result[0] || null;
  }
  
  // Get products by category
  static async findByCategory(categoryId, options = {}) {
    return this.findMany({ ...options, categoryId });
  }
  
  // Count products by category
  static async countByCategory(categoryId, options = {}) {
    let whereConditions = [eq(products.categoryId, categoryId)];
    
    if (options.isActive !== undefined) {
      whereConditions.push(eq(products.isActive, options.isActive));
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    const result = await db
      .select({ count: count() })
      .from(products)
      .where(whereClause);
    
    return result[0]?.count || 0;
  }
  
  // Get low stock products
  static async findLowStock(threshold = 10) {
    const result = await db
      .select()
      .from(products)
      .where(and(
        eq(products.isActive, true),
        sql`${products.stockQuantity} <= ${threshold}`
      ))
      .orderBy(asc(products.stockQuantity));
    
    return result;
  }
}

module.exports = ProductModel;