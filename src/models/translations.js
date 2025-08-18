const { eq, and, or } = require('drizzle-orm');
const { db } = require('../config/drizzle');
const { 
  supportedLanguages, 
  productTranslations, 
  categoryTranslations,
  products,
  categories 
} = require('./schema');

class TranslationModel {
  // Get all supported languages
  static async getSupportedLanguages() {
    return await db
      .select()
      .from(supportedLanguages)
      .where(eq(supportedLanguages.isActive, true))
      .orderBy(supportedLanguages.isDefault);
  }

  // Get default language
  static async getDefaultLanguage() {
    const result = await db
      .select()
      .from(supportedLanguages)
      .where(and(
        eq(supportedLanguages.isActive, true),
        eq(supportedLanguages.isDefault, true)
      ))
      .limit(1);
    
    return result[0] || { code: 'en', name: 'English', nativeName: 'English' };
  }

  // Check if language is supported
  static async isLanguageSupported(languageCode) {
    const result = await db
      .select({ code: supportedLanguages.code })
      .from(supportedLanguages)
      .where(and(
        eq(supportedLanguages.code, languageCode),
        eq(supportedLanguages.isActive, true)
      ))
      .limit(1);
    
    return result.length > 0;
  }

  // Product translations
  static async getProductTranslation(productId, languageCode) {
    const result = await db
      .select()
      .from(productTranslations)
      .where(and(
        eq(productTranslations.productId, productId),
        eq(productTranslations.languageCode, languageCode)
      ))
      .limit(1);
    
    return result[0] || null;
  }

  static async createProductTranslation(translationData) {
    const result = await db
      .insert(productTranslations)
      .values({
        ...translationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return result[0];
  }

  static async updateProductTranslation(productId, languageCode, updateData) {
    const result = await db
      .update(productTranslations)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(
        eq(productTranslations.productId, productId),
        eq(productTranslations.languageCode, languageCode)
      ))
      .returning();
    
    return result[0] || null;
  }

  static async deleteProductTranslation(productId, languageCode) {
    const result = await db
      .delete(productTranslations)
      .where(and(
        eq(productTranslations.productId, productId),
        eq(productTranslations.languageCode, languageCode)
      ))
      .returning();
    
    return result[0] || null;
  }

  // Category translations
  static async getCategoryTranslation(categoryId, languageCode) {
    const result = await db
      .select()
      .from(categoryTranslations)
      .where(and(
        eq(categoryTranslations.categoryId, categoryId),
        eq(categoryTranslations.languageCode, languageCode)
      ))
      .limit(1);
    
    return result[0] || null;
  }

  static async createCategoryTranslation(translationData) {
    const result = await db
      .insert(categoryTranslations)
      .values({
        ...translationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return result[0];
  }

  static async updateCategoryTranslation(categoryId, languageCode, updateData) {
    const result = await db
      .update(categoryTranslations)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(
        eq(categoryTranslations.categoryId, categoryId),
        eq(categoryTranslations.languageCode, languageCode)
      ))
      .returning();
    
    return result[0] || null;
  }

  static async deleteCategoryTranslation(categoryId, languageCode) {
    const result = await db
      .delete(categoryTranslations)
      .where(and(
        eq(categoryTranslations.categoryId, categoryId),
        eq(categoryTranslations.languageCode, languageCode)
      ))
      .returning();
    
    return result[0] || null;
  }

  // Utility methods for getting translated content
  static async getProductWithTranslation(productId, languageCode = 'en') {
    // Get base product
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product[0]) {
      return null;
    }

    // Get translation
    const translation = await this.getProductTranslation(productId, languageCode);

    // Merge base product with translation
    return {
      ...product[0],
      name: translation?.name || product[0].name,
      description: translation?.description || product[0].description,
      metaTitle: translation?.metaTitle || null,
      metaDescription: translation?.metaDescription || null,
      languageCode: translation?.languageCode || 'en',
    };
  }

  static async getCategoryWithTranslation(categoryId, languageCode = 'en') {
    // Get base category
    const category = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!category[0]) {
      return null;
    }

    // Get translation
    const translation = await this.getCategoryTranslation(categoryId, languageCode);

    // Merge base category with translation
    return {
      ...category[0],
      name: translation?.name || category[0].name,
      description: translation?.description || category[0].description,
      metaTitle: translation?.metaTitle || null,
      metaDescription: translation?.metaDescription || null,
      languageCode: translation?.languageCode || 'en',
    };
  }

  // Bulk operations
  static async getProductsWithTranslations(productIds, languageCode = 'en') {
    const products = await Promise.all(
      productIds.map(id => this.getProductWithTranslation(id, languageCode))
    );
    
    return products.filter(Boolean);
  }

  static async getCategoriesWithTranslations(categoryIds, languageCode = 'en') {
    const categories = await Promise.all(
      categoryIds.map(id => this.getCategoryWithTranslation(id, languageCode))
    );
    
    return categories.filter(Boolean);
  }
}

module.exports = TranslationModel;