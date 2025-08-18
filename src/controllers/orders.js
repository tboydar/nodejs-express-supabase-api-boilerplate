const OrderModel = require('../models/orders');
const CartModel = require('../models/cart');

class OrdersController {
  // Get user's orders with pagination
  async getUserOrders(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 10,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        dateFrom,
        dateTo
      } = req.query;

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        userId,
        status,
        sortBy,
        sortOrder,
        dateFrom,
        dateTo
      };

      const result = await OrderModel.findMany(filters);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get user orders error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get orders',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get all orders (admin only)
  async getAllOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        dateFrom,
        dateTo,
        userId
      } = req.query;

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        sortBy,
        sortOrder,
        dateFrom,
        dateTo,
        userId
      };

      const result = await OrderModel.findMany(filters);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get all orders error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get orders',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get specific order by ID
  async getOrder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.role === 'admin' ? null : req.user.id;

      const order = await OrderModel.findById(id, userId);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get order',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get order by order number
  async getOrderByNumber(req, res) {
    try {
      const { orderNumber } = req.params;
      const userId = req.user.role === 'admin' ? null : req.user.id;

      const order = await OrderModel.findByOrderNumber(orderNumber, userId);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Get order by number error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get order',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Create new order from cart
  async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;

      // Get user's cart items
      const cartItems = await CartModel.getCartItems(userId);

      if (cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Cart is empty',
          message: 'Cannot create order with empty cart'
        });
      }

      // Validate cart items (stock, availability, etc.)
      const validation = await CartModel.validateCartItems(userId);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Cart validation failed',
          message: 'Some items in your cart are no longer available or have insufficient stock',
          details: validation.invalidItems
        });
      }

      // Calculate total amount
      const totalAmount = cartItems.reduce((total, item) => {
        return total + (parseFloat(item.product.price) * item.quantity);
      }, 0);

      // Prepare order data
      const orderData = {
        orderNumber: OrderModel.generateOrderNumber(),
        status: 'pending',
        totalAmount: totalAmount.toFixed(2),
        shippingAddress: JSON.stringify(shippingAddress),
        billingAddress: billingAddress ? JSON.stringify(billingAddress) : JSON.stringify(shippingAddress),
        paymentMethod: paymentMethod || 'pending',
        paymentStatus: 'pending',
        notes: notes || null
      };

      // Create order
      const order = await OrderModel.createOrder(userId, orderData, cartItems);

      // Clear user's cart after successful order creation
      await CartModel.clearCart(userId);

      // Get complete order details
      const completeOrder = await OrderModel.findById(order.id);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: completeOrder
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create order',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update order status (admin only)
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }

      const order = await OrderModel.updateStatus(id, status);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          updatedAt: order.updatedAt
        }
      });
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update order status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update payment status (admin only)
  async updatePaymentStatus(req, res) {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;

      const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment status',
          message: `Payment status must be one of: ${validPaymentStatuses.join(', ')}`
        });
      }

      const order = await OrderModel.updatePaymentStatus(id, paymentStatus);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      res.json({
        success: true,
        message: 'Payment status updated successfully',
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          updatedAt: order.updatedAt
        }
      });
    } catch (error) {
      console.error('Update payment status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update payment status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Cancel order
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.role === 'admin' ? null : req.user.id;

      const order = await OrderModel.cancel(id, userId);

      res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          updatedAt: order.updatedAt
        }
      });
    } catch (error) {
      console.error('Cancel order error:', error);
      
      if (error.message === 'Order not found') {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
      
      if (error.message.includes('cannot be cancelled')) {
        return res.status(400).json({
          success: false,
          error: 'Cannot cancel order',
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to cancel order',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get order statistics
  async getOrderStats(req, res) {
    try {
      const { dateFrom, dateTo, userId } = req.query;
      
      // Only admin can see all stats, users can only see their own
      const targetUserId = req.user.role === 'admin' ? userId : req.user.id;

      const stats = await OrderModel.getOrderStats(targetUserId, dateFrom, dateTo);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get order stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get order statistics',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get user's recent orders
  async getRecentOrders(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 5 } = req.query;

      const orders = await OrderModel.getUserRecentOrders(userId, parseInt(limit));

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Get recent orders error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get recent orders',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update order (limited fields for users)
  async updateOrder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.role === 'admin' ? null : req.user.id;
      
      // Get current order to check if it can be updated
      const currentOrder = await OrderModel.findById(id, userId);
      if (!currentOrder) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      // Check if order can be updated
      const updatableStatuses = ['pending', 'confirmed'];
      if (!updatableStatuses.includes(currentOrder.status)) {
        return res.status(400).json({
          success: false,
          error: 'Order cannot be updated',
          message: 'Order can only be updated when status is pending or confirmed'
        });
      }

      // Filter allowed fields based on user role
      let updateData = {};
      if (req.user.role === 'admin') {
        // Admin can update more fields
        const allowedFields = ['shippingAddress', 'billingAddress', 'paymentMethod', 'notes', 'status', 'paymentStatus'];
        for (const field of allowedFields) {
          if (req.body[field] !== undefined) {
            if (field === 'shippingAddress' || field === 'billingAddress') {
              updateData[field] = JSON.stringify(req.body[field]);
            } else {
              updateData[field] = req.body[field];
            }
          }
        }
      } else {
        // Regular users can only update address and notes
        const allowedFields = ['shippingAddress', 'billingAddress', 'notes'];
        for (const field of allowedFields) {
          if (req.body[field] !== undefined) {
            if (field === 'shippingAddress' || field === 'billingAddress') {
              updateData[field] = JSON.stringify(req.body[field]);
            } else {
              updateData[field] = req.body[field];
            }
          }
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }

      const updatedOrder = await OrderModel.update(id, updateData, userId);

      res.json({
        success: true,
        message: 'Order updated successfully',
        data: updatedOrder
      });
    } catch (error) {
      console.error('Update order error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update order',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Check if user can review order
  async canReviewOrder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const canReview = await OrderModel.canUserReview(userId, id);

      res.json({
        success: true,
        data: {
          canReview
        }
      });
    } catch (error) {
      console.error('Check review eligibility error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check review eligibility',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new OrdersController();