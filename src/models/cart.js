const { eq, and, desc, count, sql } = require('drizzle-orm');
const { db } = require('../config/drizzle');
const { cartItems, products, categories, productTranslations, categoryTranslations } = require('./schema');

class CartModel {
  // Get user's cart items with product details
  static async getCartItems(userId, language = 'en') {
    const items = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        addedAt: cartItems.createdAt,
        updatedAt: cartItems.updatedAt,
        product: {
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          stockQuantity: products.stockQuantity,
          imageUrl: products.imageUrl,
          images: products.images,
          sku: products.sku,
          isActive: products.isActive,
          weight: products.weight,
          categoryId: products.categoryId,
        },
        category: {
          id: categories.id,
          name: categories.name,
        }
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(
        eq(cartItems.userId, userId),
        eq(products.isActive, true)
      ))
      .orderBy(desc(cartItems.createdAt));

    // Get translations if language is not English
    if (language && language !== 'en') {
      for (let item of items) {
        if (item.product) {
          // Get product translation
          const productTranslation = await db
            .select({
              name: productTranslations.name,
              description: productTranslations.description,
              metaTitle: productTranslations.metaTitle,
              metaDescription: productTranslations.metaDescription
            })
            .from(productTranslations)
            .where(and(
              eq(productTranslations.productId, item.product.id),
              eq(productTranslations.languageCode, language)
            ))
            .limit(1);

          if (productTranslation[0]) {
            item.product.name = productTranslation[0].name || item.product.name;
            item.product.description = productTranslation[0].description || item.product.description;
            item.product.metaTitle = productTranslation[0].metaTitle;
            item.product.metaDescription = productTranslation[0].metaDescription;
          }

          // Get category translation
          if (item.category) {
            const categoryTranslation = await db
              .select({
                name: categoryTranslations.name,
                description: categoryTranslations.description
              })
              .from(categoryTranslations)
              .where(and(
                eq(categoryTranslations.categoryId, item.category.id),
                eq(categoryTranslations.languageCode, language)
              ))
              .limit(1);

            if (categoryTranslation[0]) {
              item.category.name = categoryTranslation[0].name || item.category.name;
              item.category.description = categoryTranslation[0].description || item.category.description;
            }
          }
        }
      }
    }

    return items;
  }

  // Add item to cart or update quantity if exists
  static async addToCart(userId, productId, quantity = 1) {
    // Check if item already exists in cart
    const existingItem = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.userId, userId),
        eq(cartItems.productId, productId)
      ))
      .limit(1);

    if (existingItem.length > 0) {
      // Update existing item quantity
      const newQuantity = existingItem[0].quantity + quantity;
      const result = await db
        .update(cartItems)
        .set({
          quantity: newQuantity,
          updatedAt: new Date()
        })
        .where(eq(cartItems.id, existingItem[0].id))
        .returning();

      return result[0];
    } else {
      // Add new item to cart
      const result = await db
        .insert(cartItems)
        .values({
          userId,
          productId,
          quantity,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return result[0];
    }
  }

  // Update cart item quantity
  static async updateCartItem(userId, cartItemId, quantity) {
    const result = await db
      .update(cartItems)
      .set({
        quantity: quantity,
        updatedAt: new Date()
      })
      .where(and(
        eq(cartItems.id, cartItemId),
        eq(cartItems.userId, userId)
      ))
      .returning();

    return result[0] || null;
  }

  // Remove item from cart
  static async removeFromCart(userId, cartItemId) {
    const result = await db
      .delete(cartItems)
      .where(and(
        eq(cartItems.id, cartItemId),
        eq(cartItems.userId, userId)
      ))
      .returning();

    return result[0] || null;
  }

  // Remove product from cart by product ID
  static async removeProductFromCart(userId, productId) {
    const result = await db
      .delete(cartItems)
      .where(and(
        eq(cartItems.userId, userId),
        eq(cartItems.productId, productId)
      ))
      .returning();

    return result;
  }

  // Clear entire cart
  static async clearCart(userId) {
    const result = await db
      .delete(cartItems)
      .where(eq(cartItems.userId, userId))
      .returning();

    return result;
  }

  // Get cart summary (total items and total price)
  static async getCartSummary(userId) {
    const summary = await db
      .select({
        totalItems: count(cartItems.id),
        totalQuantity: sql`SUM(${cartItems.quantity})`,
        totalAmount: sql`SUM(${cartItems.quantity} * CAST(${products.price} AS DECIMAL))`
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(and(
        eq(cartItems.userId, userId),
        eq(products.isActive, true)
      ));

    const result = summary[0];
    return {
      totalItems: Number(result.totalItems) || 0,
      totalQuantity: Number(result.totalQuantity) || 0,
      totalAmount: Number(result.totalAmount) || 0
    };
  }

  // Get cart item count for a user
  static async getCartItemCount(userId) {
    const result = await db
      .select({
        count: sql`SUM(${cartItems.quantity})`
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(and(
        eq(cartItems.userId, userId),
        eq(products.isActive, true)
      ));

    return Number(result[0]?.count) || 0;
  }

  // Check if product is in user's cart
  static async isProductInCart(userId, productId) {
    const result = await db
      .select({ id: cartItems.id })
      .from(cartItems)
      .where(and(
        eq(cartItems.userId, userId),
        eq(cartItems.productId, productId)
      ))
      .limit(1);

    return result.length > 0;
  }

  // Get specific cart item
  static async getCartItem(userId, cartItemId) {
    const result = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        updatedAt: cartItems.updatedAt,
        product: {
          id: products.id,
          name: products.name,
          price: products.price,
          stockQuantity: products.stockQuantity,
          isActive: products.isActive
        }
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(and(
        eq(cartItems.id, cartItemId),
        eq(cartItems.userId, userId)
      ))
      .limit(1);

    return result[0] || null;
  }

  // Validate cart items (check stock, active status, etc.)
  static async validateCartItems(userId) {
    const items = await db
      .select({
        cartItemId: cartItems.id,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        productName: products.name,
        productPrice: products.price,
        stockQuantity: products.stockQuantity,
        isActive: products.isActive
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));

    const validation = {
      isValid: true,
      issues: [],
      validItems: [],
      invalidItems: []
    };

    for (const item of items) {
      const issue = {
        cartItemId: item.cartItemId,
        productId: item.productId,
        productName: item.productName,
        requestedQuantity: item.quantity,
        issues: []
      };

      // Check if product is still active
      if (!item.isActive) {
        issue.issues.push('Product is no longer available');
        validation.isValid = false;
      }

      // Check stock availability
      if (item.quantity > item.stockQuantity) {
        issue.issues.push(`Insufficient stock. Available: ${item.stockQuantity}, Requested: ${item.quantity}`);
        validation.isValid = false;
      }

      if (issue.issues.length > 0) {
        validation.invalidItems.push(issue);
      } else {
        validation.validItems.push({
          cartItemId: item.cartItemId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.productPrice
        });
      }
    }

    return validation;
  }

  // Merge guest cart with user cart (for when user logs in)
  static async mergeGuestCart(userId, guestCartItems) {
    const mergedItems = [];

    for (const guestItem of guestCartItems) {
      const { productId, quantity } = guestItem;
      
      try {
        const result = await this.addToCart(userId, productId, quantity);
        mergedItems.push(result);
      } catch (error) {
        console.error(`Error merging cart item ${productId}:`, error);
      }
    }

    return mergedItems;
  }
}

module.exports = CartModel;