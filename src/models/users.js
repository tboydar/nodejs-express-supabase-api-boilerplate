const { eq, and, or, desc, asc, count, ilike } = require('drizzle-orm');
const { db } = require('../config/drizzle');
const { users } = require('./schema');
const bcrypt = require('bcryptjs');

class UserModel {
  // Get all users with optional filtering and pagination
  static async findMany({
    page = 1,
    limit = 20,
    search,
    role,
    isActive = true,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = {}) {
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    
    if (isActive !== undefined) {
      whereConditions.push(eq(users.isActive, isActive));
    }
    
    if (search) {
      whereConditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.fullName, `%${search}%`)
        )
      );
    }
    
    if (role) {
      whereConditions.push(eq(users.role, role));
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    // Sort configuration
    const sortColumn = users[sortBy] || users.createdAt;
    const sortDirection = sortOrder === 'asc' ? asc : desc;
    
    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(users)
      .where(whereClause);
    
    const total = totalResult[0]?.count || 0;
    
    // Get paginated results (exclude password from selection)
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        isEmailVerified: users.isEmailVerified,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(sortDirection(sortColumn))
      .limit(limit)
      .offset(offset);
    
    return {
      data: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }
  
  // Get user by ID (exclude password)
  static async findById(id) {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        isEmailVerified: users.isEmailVerified,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    return result[0] || null;
  }
  
  // Get user by email (include password for authentication)
  static async findByEmail(email, includePassword = false) {
    const selectFields = {
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      isEmailVerified: users.isEmailVerified,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    };
    
    if (includePassword) {
      selectFields.password = users.password;
    }
    
    const result = await db
      .select(selectFields)
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return result[0] || null;
  }
  
  // Create new user
  static async create(userData) {
    const { password, ...otherData } = userData;
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const result = await db
      .insert(users)
      .values({
        ...otherData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        isEmailVerified: users.isEmailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    
    return result[0];
  }
  
  // Update user
  static async update(id, updateData) {
    const { password, ...otherData } = updateData;
    
    let dataToUpdate = {
      ...otherData,
      updatedAt: new Date(),
    };
    
    // Hash password if provided
    if (password) {
      const saltRounds = 12;
      dataToUpdate.password = await bcrypt.hash(password, saltRounds);
    }
    
    const result = await db
      .update(users)
      .set(dataToUpdate)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        isEmailVerified: users.isEmailVerified,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    
    return result[0] || null;
  }
  
  // Delete user (soft delete by setting isActive to false)
  static async delete(id) {
    const result = await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        isActive: users.isActive,
      });
    
    return result[0] || null;
  }
  
  // Hard delete user
  static async hardDelete(id) {
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
      });
    
    return result[0] || null;
  }
  
  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
  
  // Update last login time
  static async updateLastLogin(id) {
    const result = await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        lastLoginAt: users.lastLoginAt,
      });
    
    return result[0] || null;
  }
  
  // Verify email
  static async verifyEmail(id) {
    const result = await db
      .update(users)
      .set({
        isEmailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        isEmailVerified: users.isEmailVerified,
      });
    
    return result[0] || null;
  }
  
  // Change password
  static async changePassword(id, newPassword) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    const result = await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        updatedAt: users.updatedAt,
      });
    
    return result[0] || null;
  }
  
  // Get user count by role
  static async countByRole(role) {
    const result = await db
      .select({ count: count() })
      .from(users)
      .where(and(
        eq(users.role, role),
        eq(users.isActive, true)
      ));
    
    return result[0]?.count || 0;
  }
  
  // Check if email exists
  static async emailExists(email, excludeId = null) {
    let whereConditions = [eq(users.email, email)];
    
    if (excludeId) {
      whereConditions.push(eq(users.id, excludeId));
    }
    
    const result = await db
      .select({ count: count() })
      .from(users)
      .where(excludeId ? and(...whereConditions) : whereConditions[0]);
    
    return (result[0]?.count || 0) > 0;
  }
}

module.exports = UserModel;