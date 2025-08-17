const { eq, like, and, desc, asc, count } = require('drizzle-orm');
const { db } = require('../config/drizzle');
const { profiles, orders, cartItems } = require('./schema');

class ProfileModel {
  // Get all profiles (admin only)
  static async findMany({
    page = 1,
    limit = 50,
    search,
    role,
    isActive = true,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = {}) {
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    
    if (isActive !== undefined) {
      whereConditions.push(eq(profiles.isActive, isActive));
    }
    
    if (role) {
      whereConditions.push(eq(profiles.role, role));
    }
    
    if (search) {
      whereConditions.push(
        or(
          like(profiles.fullName, `%${search}%`),
          like(profiles.email, `%${search}%`),
          like(profiles.phone, `%${search}%`)
        )
      );
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    // Sort configuration
    const orderBy = sortOrder === 'desc' ? desc(profiles[sortBy]) : asc(profiles[sortBy]);
    
    const result = await db
      .select()
      .from(profiles)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);
    
    // Get total count for pagination
    const [{ total }] = await db
      .select({ total: count() })
      .from(profiles)
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
  
  // Get single profile by ID
  static async findById(id) {
    const result = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);
    
    return result[0] || null;
  }
  
  // Get profile by email
  static async findByEmail(email) {
    const result = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);
    
    return result[0] || null;
  }
  
  // Create new profile
  static async create(profileData) {
    const result = await db
      .insert(profiles)
      .values({
        ...profileData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return result[0];
  }
  
  // Update profile
  static async update(id, updateData) {
    const result = await db
      .update(profiles)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, id))
      .returning();
    
    return result[0] || null;
  }
  
  // Delete profile (soft delete)
  static async delete(id) {
    const result = await db
      .update(profiles)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, id))
      .returning();
    
    return result[0] || null;
  }
  
  // Get profile with statistics
  static async findWithStats(id) {
    const profile = await this.findById(id);
    
    if (!profile) {
      return null;
    }
    
    // Get order count and total spent
    const orderStats = await db
      .select({
        orderCount: count(orders.id),
        totalSpent: sql`COALESCE(SUM(${orders.totalAmount}), 0)`,
      })
      .from(orders)
      .where(eq(orders.userId, id));
    
    // Get cart items count
    const cartStats = await db
      .select({
        cartItemCount: count(cartItems.id),
      })
      .from(cartItems)
      .where(eq(cartItems.userId, id));
    
    return {
      ...profile,
      stats: {
        orderCount: Number(orderStats[0]?.orderCount || 0),
        totalSpent: Number(orderStats[0]?.totalSpent || 0),
        cartItemCount: Number(cartStats[0]?.cartItemCount || 0),
      },
    };
  }
  
  // Update user role (admin only)
  static async updateRole(id, role) {
    const result = await db
      .update(profiles)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, id))
      .returning();
    
    return result[0] || null;
  }
  
  // Get customers (role = 'customer')
  static async findCustomers(options = {}) {
    return this.findMany({ ...options, role: 'customer' });
  }
  
  // Get admins (role = 'admin')
  static async findAdmins(options = {}) {
    return this.findMany({ ...options, role: 'admin' });
  }
  
  // Check if profile exists
  static async exists(id) {
    const result = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);
    
    return result.length > 0;
  }
  
  // Update last login (if tracking)
  static async updateLastLogin(id) {
    const result = await db
      .update(profiles)
      .set({
        updatedAt: new Date(), // Using updatedAt as lastLogin for simplicity
      })
      .where(eq(profiles.id, id))
      .returning();
    
    return result[0] || null;
  }
}

module.exports = ProfileModel;