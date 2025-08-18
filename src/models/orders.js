const { eq, and, desc, asc, count, sql, inArray } = require('drizzle-orm');
const { db } = require('../config/drizzle');
const { orders, orderItems, products, users, productTranslations } = require('./schema');

class OrderModel {
  // Create new order from cart items
  static async createOrder(userId, orderData, cartItems) {
    return await db.transaction(async (tx) => {
      // Create the order
      const orderResult = await tx
        .insert(orders)
        .values({
          ...orderData,
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      const order = orderResult[0];

      // Create order items
      for (const cartItem of cartItems) {
        await tx
          .insert(orderItems)
          .values({
            orderId: order.id,
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            price: cartItem.product.price,
            productName: cartItem.product.name,
            productImage: cartItem.product.imageUrl,
            createdAt: new Date(),
            updatedAt: new Date()
          });

        // Decrease product stock
        await tx
          .update(products)
          .set({
            stockQuantity: sql`${products.stockQuantity} - ${cartItem.quantity}`,
            updatedAt: new Date()
          })
          .where(eq(products.id, cartItem.productId));
      }

      return order;
    });
  }

  // Get orders with pagination and filters
  static async findMany({
    page = 1,
    limit = 20,
    userId,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    dateFrom,
    dateTo
  } = {}) {
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    
    if (userId) {
      whereConditions.push(eq(orders.userId, userId));
    }
    
    if (status) {
      whereConditions.push(eq(orders.status, status));
    }
    
    if (dateFrom) {
      whereConditions.push(sql`${orders.createdAt} >= ${new Date(dateFrom)}`);
    }
    
    if (dateTo) {
      whereConditions.push(sql`${orders.createdAt} <= ${new Date(dateTo)}`);
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    // Sort configuration
    const sortColumn = orders[sortBy] || orders.createdAt;
    const sortDirection = sortOrder === 'asc' ? asc : desc;
    
    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(orders)
      .where(whereClause);
    
    const total = totalResult[0]?.count || 0;
    
    // Get paginated results with user info
    const result = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        shippingAddress: orders.shippingAddress,
        billingAddress: orders.billingAddress,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          phone: users.phone
        }
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
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

  // Get order by ID with items
  static async findById(id, userId = null) {
    let whereConditions = [eq(orders.id, id)];
    
    if (userId) {
      whereConditions.push(eq(orders.userId, userId));
    }
    
    const whereClause = and(...whereConditions);
    
    // Get order with user info
    const orderResult = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        shippingAddress: orders.shippingAddress,
        billingAddress: orders.billingAddress,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          phone: users.phone
        }
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(whereClause)
      .limit(1);

    if (orderResult.length === 0) {
      return null;
    }

    const order = orderResult[0];

    // Get order items with product details
    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        productName: orderItems.productName,
        productImage: orderItems.productImage,
        createdAt: orderItems.createdAt,
        product: {
          id: products.id,
          name: products.name,
          description: products.description,
          imageUrl: products.imageUrl,
          sku: products.sku,
          isActive: products.isActive
        }
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id))
      .orderBy(orderItems.createdAt);

    return {
      ...order,
      items
    };
  }

  // Get order by order number
  static async findByOrderNumber(orderNumber, userId = null) {
    let whereConditions = [eq(orders.orderNumber, orderNumber)];
    
    if (userId) {
      whereConditions.push(eq(orders.userId, userId));
    }
    
    const whereClause = and(...whereConditions);
    
    const result = await db
      .select({ id: orders.id })
      .from(orders)
      .where(whereClause)
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.findById(result[0].id, userId);
  }

  // Update order status
  static async updateStatus(id, status, userId = null) {
    let whereConditions = [eq(orders.id, id)];
    
    if (userId) {
      whereConditions.push(eq(orders.userId, userId));
    }
    
    const whereClause = and(...whereConditions);
    
    const result = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(whereClause)
      .returning();

    return result[0] || null;
  }

  // Update payment status
  static async updatePaymentStatus(id, paymentStatus, userId = null) {
    let whereConditions = [eq(orders.id, id)];
    
    if (userId) {
      whereConditions.push(eq(orders.userId, userId));
    }
    
    const whereClause = and(...whereConditions);
    
    const result = await db
      .update(orders)
      .set({
        paymentStatus,
        updatedAt: new Date()
      })
      .where(whereClause)
      .returning();

    return result[0] || null;
  }

  // Update order
  static async update(id, updateData, userId = null) {
    let whereConditions = [eq(orders.id, id)];
    
    if (userId) {
      whereConditions.push(eq(orders.userId, userId));
    }
    
    const whereClause = and(...whereConditions);
    
    const result = await db
      .update(orders)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(whereClause)
      .returning();

    return result[0] || null;
  }

  // Cancel order (only if status allows)
  static async cancel(id, userId = null) {
    const order = await this.findById(id, userId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new Error('Order cannot be cancelled at this stage');
    }

    return await db.transaction(async (tx) => {
      // Update order status
      const result = await tx
        .update(orders)
        .set({
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(orders.id, id))
        .returning();

      // Restore product stock
      for (const item of order.items) {
        if (item.product && item.product.isActive) {
          await tx
            .update(products)
            .set({
              stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`,
              updatedAt: new Date()
            })
            .where(eq(products.id, item.productId));
        }
      }

      return result[0];
    });
  }

  // Get order statistics
  static async getOrderStats(userId = null, dateFrom = null, dateTo = null) {
    let whereConditions = [];
    
    if (userId) {
      whereConditions.push(eq(orders.userId, userId));
    }
    
    if (dateFrom) {
      whereConditions.push(sql`${orders.createdAt} >= ${new Date(dateFrom)}`);
    }
    
    if (dateTo) {
      whereConditions.push(sql`${orders.createdAt} <= ${new Date(dateTo)}`);
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    // Get overall stats
    const overallStats = await db
      .select({
        totalOrders: count(orders.id),
        totalRevenue: sql`SUM(CAST(${orders.totalAmount} AS DECIMAL))`,
        averageOrderValue: sql`AVG(CAST(${orders.totalAmount} AS DECIMAL))`
      })
      .from(orders)
      .where(whereClause);

    // Get stats by status
    const statusStats = await db
      .select({
        status: orders.status,
        count: count(orders.id),
        totalValue: sql`SUM(CAST(${orders.totalAmount} AS DECIMAL))`
      })
      .from(orders)
      .where(whereClause)
      .groupBy(orders.status);

    return {
      overall: {
        totalOrders: Number(overallStats[0]?.totalOrders) || 0,
        totalRevenue: Number(overallStats[0]?.totalRevenue) || 0,
        averageOrderValue: Number(overallStats[0]?.averageOrderValue) || 0
      },
      byStatus: statusStats.map(stat => ({
        status: stat.status,
        count: Number(stat.count),
        totalValue: Number(stat.totalValue) || 0
      }))
    };
  }

  // Generate unique order number
  static generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp.slice(-8)}-${random}`;
  }

  // Get user's recent orders
  static async getUserRecentOrders(userId, limit = 5) {
    const result = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt
      })
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    return result;
  }

  // Get orders with items for specific products (for analytics)
  static async getOrdersWithProduct(productId, limit = 10) {
    const result = await db
      .select({
        orderId: orderItems.orderId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        orderNumber: orders.orderNumber,
        orderStatus: orders.status,
        orderDate: orders.createdAt,
        customerEmail: users.email,
        customerName: users.fullName
      })
      .from(orderItems)
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orderItems.productId, productId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    return result;
  }

  // Check if user can review order (order delivered)
  static async canUserReview(userId, orderId) {
    const result = await db
      .select({ status: orders.status })
      .from(orders)
      .where(and(
        eq(orders.id, orderId),
        eq(orders.userId, userId)
      ))
      .limit(1);

    return result.length > 0 && result[0].status === 'delivered';
  }
}

module.exports = OrderModel;