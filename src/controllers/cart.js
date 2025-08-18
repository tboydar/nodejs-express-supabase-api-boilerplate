const CartModel = require('../models/cart');
const ProductModel = require('../models/products');

class CartController {
  // Get user's cart items
  async getCart(req, res) {
    try {
      const userId = req.user.id;
      const language = req.language || req.headers['accept-language'] || 'en';

      // Get cart items with product details
      const cartItems = await CartModel.getCartItems(userId, language);
      
      // Get cart summary
      const summary = await CartModel.getCartSummary(userId);

      res.json({
        success: true,
        data: {
          items: cartItems,
          summary: {
            totalItems: summary.totalItems,
            totalQuantity: summary.totalQuantity,
            totalAmount: Number(summary.totalAmount).toFixed(2),
            currency: 'USD'
          }
        }
      });
    } catch (error) {
      console.error('Get cart error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get cart items',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Add item to cart
  async addToCart(req, res) {
    try {
      const userId = req.user.id;
      const { productId, quantity = 1 } = req.body;

      // Validate product exists and is active
      const product = await ProductModel.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Product is not available',
          message: 'This product is currently not available for purchase'
        });
      }

      // Check stock availability
      if (quantity > product.stockQuantity) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient stock',
          message: `Only ${product.stockQuantity} items available in stock`,
          availableStock: product.stockQuantity
        });
      }

      // Check if item is already in cart
      const existingInCart = await CartModel.isProductInCart(userId, productId);
      if (existingInCart) {
        // Get current cart item to check total quantity
        const cartItems = await CartModel.getCartItems(userId);
        const currentCartItem = cartItems.find(item => item.productId === productId);
        const totalQuantity = currentCartItem.quantity + quantity;
        
        if (totalQuantity > product.stockQuantity) {
          return res.status(400).json({
            success: false,
            error: 'Insufficient stock',
            message: `Cannot add ${quantity} more items. Only ${product.stockQuantity - currentCartItem.quantity} more items can be added`,
            currentInCart: currentCartItem.quantity,
            availableToAdd: product.stockQuantity - currentCartItem.quantity
          });
        }
      }

      // Add to cart
      const cartItem = await CartModel.addToCart(userId, productId, quantity);

      // Get updated cart summary
      const summary = await CartModel.getCartSummary(userId);

      res.status(201).json({
        success: true,
        message: 'Item added to cart successfully',
        data: {
          cartItem,
          summary: {
            totalItems: summary.totalItems,
            totalQuantity: summary.totalQuantity,
            totalAmount: Number(summary.totalAmount).toFixed(2)
          }
        }
      });
    } catch (error) {
      console.error('Add to cart error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add item to cart',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update cart item quantity
  async updateCartItem(req, res) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;
      const { quantity } = req.body;

      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid quantity',
          message: 'Quantity must be greater than 0'
        });
      }

      // Get cart item to validate ownership and get product info
      const cartItem = await CartModel.getCartItem(userId, itemId);
      if (!cartItem) {
        return res.status(404).json({
          success: false,
          error: 'Cart item not found'
        });
      }

      // Check stock availability for the new quantity
      if (quantity > cartItem.product.stockQuantity) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient stock',
          message: `Only ${cartItem.product.stockQuantity} items available in stock`,
          availableStock: cartItem.product.stockQuantity
        });
      }

      // Check if product is still active
      if (!cartItem.product.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Product not available',
          message: 'This product is no longer available'
        });
      }

      // Update cart item
      const updatedItem = await CartModel.updateCartItem(userId, itemId, quantity);

      if (!updatedItem) {
        return res.status(404).json({
          success: false,
          error: 'Failed to update cart item'
        });
      }

      // Get updated cart summary
      const summary = await CartModel.getCartSummary(userId);

      res.json({
        success: true,
        message: 'Cart item updated successfully',
        data: {
          cartItem: updatedItem,
          summary: {
            totalItems: summary.totalItems,
            totalQuantity: summary.totalQuantity,
            totalAmount: Number(summary.totalAmount).toFixed(2)
          }
        }
      });
    } catch (error) {
      console.error('Update cart item error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update cart item',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Remove item from cart
  async removeFromCart(req, res) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;

      // Verify cart item belongs to user
      const cartItem = await CartModel.getCartItem(userId, itemId);
      if (!cartItem) {
        return res.status(404).json({
          success: false,
          error: 'Cart item not found'
        });
      }

      // Remove item
      const removedItem = await CartModel.removeFromCart(userId, itemId);

      if (!removedItem) {
        return res.status(404).json({
          success: false,
          error: 'Failed to remove item from cart'
        });
      }

      // Get updated cart summary
      const summary = await CartModel.getCartSummary(userId);

      res.json({
        success: true,
        message: 'Item removed from cart successfully',
        data: {
          removedItem,
          summary: {
            totalItems: summary.totalItems,
            totalQuantity: summary.totalQuantity,
            totalAmount: Number(summary.totalAmount).toFixed(2)
          }
        }
      });
    } catch (error) {
      console.error('Remove from cart error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove item from cart',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Clear entire cart
  async clearCart(req, res) {
    try {
      const userId = req.user.id;

      const removedItems = await CartModel.clearCart(userId);

      res.json({
        success: true,
        message: 'Cart cleared successfully',
        data: {
          removedItemsCount: removedItems.length,
          summary: {
            totalItems: 0,
            totalQuantity: 0,
            totalAmount: '0.00'
          }
        }
      });
    } catch (error) {
      console.error('Clear cart error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cart',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get cart summary only
  async getCartSummary(req, res) {
    try {
      const userId = req.user.id;

      const summary = await CartModel.getCartSummary(userId);

      res.json({
        success: true,
        data: {
          summary: {
            totalItems: summary.totalItems,
            totalQuantity: summary.totalQuantity,
            totalAmount: Number(summary.totalAmount).toFixed(2),
            currency: 'USD'
          }
        }
      });
    } catch (error) {
      console.error('Get cart summary error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get cart summary',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Validate cart items (check stock, availability, etc.)
  async validateCart(req, res) {
    try {
      const userId = req.user.id;

      const validation = await CartModel.validateCartItems(userId);

      res.json({
        success: true,
        data: {
          isValid: validation.isValid,
          validItems: validation.validItems,
          invalidItems: validation.invalidItems,
          summary: {
            totalValidItems: validation.validItems.length,
            totalInvalidItems: validation.invalidItems.length,
            issues: validation.invalidItems.map(item => ({
              productName: item.productName,
              issues: item.issues
            }))
          }
        }
      });
    } catch (error) {
      console.error('Validate cart error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate cart',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Merge guest cart (when user logs in)
  async mergeGuestCart(req, res) {
    try {
      const userId = req.user.id;
      const { guestCartItems } = req.body;

      if (!Array.isArray(guestCartItems) || guestCartItems.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid guest cart data',
          message: 'guestCartItems must be a non-empty array'
        });
      }

      // Validate guest cart items format
      for (const item of guestCartItems) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Invalid cart item format',
            message: 'Each cart item must have productId and valid quantity'
          });
        }
      }

      const mergedItems = await CartModel.mergeGuestCart(userId, guestCartItems);

      // Get updated cart summary
      const summary = await CartModel.getCartSummary(userId);

      res.json({
        success: true,
        message: 'Guest cart merged successfully',
        data: {
          mergedItemsCount: mergedItems.length,
          summary: {
            totalItems: summary.totalItems,
            totalQuantity: summary.totalQuantity,
            totalAmount: Number(summary.totalAmount).toFixed(2)
          }
        }
      });
    } catch (error) {
      console.error('Merge guest cart error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to merge guest cart',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get cart item count (for header badge)
  async getCartCount(req, res) {
    try {
      const userId = req.user.id;

      const count = await CartModel.getCartItemCount(userId);

      res.json({
        success: true,
        data: {
          count: count
        }
      });
    } catch (error) {
      console.error('Get cart count error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get cart count',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new CartController();