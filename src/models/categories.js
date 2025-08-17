const { eq, like, desc, asc, count, sql } = require('drizzle-orm');
const { db } = require('../config/drizzle');
const { categories, products } = require('./schema');

class CategoryModel {
  // Get all categories with optional pagination
  static async findMany({
    page = 1,
    limit = 50,
    search,
    isActive = true,
    sortBy = 'name',
    sortOrder = 'asc',
  } = {}) {
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    
    if (isActive !== undefined) {
      whereConditions.push(eq(categories.isActive, isActive));
    }
    
    if (search) {
      whereConditions.push(
        like(categories.name, `%${search}%`)
      );
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    // Sort configuration
    const orderBy = sortOrder === 'desc' ? desc(categories[sortBy]) : asc(categories[sortBy]);
    
    // Get categories with product count
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        imageUrl: categories.imageUrl,
        isActive: categories.isActive,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        productCount: count(products.id),
      })
      .from(categories)
      .leftJoin(products, eq(categories.id, products.categoryId))
      .where(whereClause)
      .groupBy(categories.id)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);
    
    // Get total count for pagination
    const [{ total }] = await db
      .select({ total: count() })
      .from(categories)
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
  
  // Get single category by ID
  static async findById(id) {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        imageUrl: categories.imageUrl,
        isActive: categories.isActive,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        productCount: count(products.id),
      })
      .from(categories)
      .leftJoin(products, eq(categories.id, products.categoryId))
      .where(eq(categories.id, id))
      .groupBy(categories.id)
      .limit(1);
    
    return result[0] || null;
  }
  
  // Get category by name
  static async findByName(name) {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.name, name))
      .limit(1);
    
    return result[0] || null;
  }
  
  // Create new category
  static async create(categoryData) {
    const result = await db
      .insert(categories)
      .values({
        ...categoryData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return result[0];
  }
  
  // Update category
  static async update(id, updateData) {
    const result = await db
      .update(categories)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();
    
    return result[0] || null;
  }
  
  // Delete category (soft delete)
  static async delete(id) {
    const result = await db
      .update(categories)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();
    
    return result[0] || null;
  }
  
  // Hard delete category
  static async hardDelete(id) {
    // First check if category has products
    const productCount = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.categoryId, id));
    
    if (productCount[0].count > 0) {
      throw new Error('Cannot delete category that has products. Remove products first or use soft delete.');
    }
    
    const result = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();
    
    return result[0] || null;
  }
  
  // Get categories with their products
  static async findWithProducts(categoryId) {
    const category = await this.findById(categoryId);
    
    if (!category) {
      return null;
    }
    
    const categoryProducts = await db
      .select()
      .from(products)
      .where(eq(products.categoryId, categoryId))
      .orderBy(asc(products.name));
    
    return {
      ...category,
      products: categoryProducts,
    };
  }
  
  // Get popular categories (by product count)
  static async findPopular(limit = 10) {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        imageUrl: categories.imageUrl,
        productCount: count(products.id),
      })
      .from(categories)
      .leftJoin(products, eq(categories.id, products.categoryId))
      .where(eq(categories.isActive, true))
      .groupBy(categories.id)
      .orderBy(desc(count(products.id)))
      .limit(limit);
    
    return result;
  }
}

module.exports = CategoryModel;