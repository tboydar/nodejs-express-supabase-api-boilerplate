const CategoryModel = require('../models/categories');
const ProductModel = require('../models/products');
const TranslationModel = require('../models/translations');

class CategoriesController {
  // Get all categories
  async getCategories(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        isActive = true,
        fields
      } = req.query;

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        isActive: isActive === 'false' ? false : true,
        fields: fields ? fields.split(',') : undefined
      };

      const result = await CategoryModel.findMany(filters);

      // If language is specified, get translations
      const language = req.language || req.headers['accept-language'] || 'en';
      if (language && language !== 'en') {
        result.data = await Promise.all(
          result.data.map(async (category) => {
            const translated = await TranslationModel.getCategoryWithTranslation(category.id, language);
            return translated || category;
          })
        );
      }

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        meta: {
          total: result.pagination.total,
          page: result.pagination.page,
          limit: result.pagination.limit,
          totalPages: result.pagination.totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch categories',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get category by ID
  async getCategory(req, res) {
    try {
      const { id } = req.params;
      const language = req.language || req.headers['accept-language'] || 'en';

      let category;
      if (language && language !== 'en') {
        category = await TranslationModel.getCategoryWithTranslation(id, language);
      } else {
        category = await CategoryModel.findById(id);
      }

      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }

      // Get product count for this category
      const productCount = await ProductModel.countByCategory(id);
      category.productCount = productCount;

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch category',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get category with products
  async getCategoryWithProducts(req, res) {
    try {
      const { id } = req.params;
      const {
        page = 1,
        limit = 12,
        sort = 'newest'
      } = req.query;

      const language = req.language || req.headers['accept-language'] || 'en';

      // Get category
      let category;
      if (language && language !== 'en') {
        category = await TranslationModel.getCategoryWithTranslation(id, language);
      } else {
        category = await CategoryModel.findById(id);
      }

      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }

      // Parse sort parameter
      let sortBy = 'createdAt';
      let sortOrder = 'desc';

      switch (sort) {
        case 'name_asc':
          sortBy = 'name';
          sortOrder = 'asc';
          break;
        case 'name_desc':
          sortBy = 'name';
          sortOrder = 'desc';
          break;
        case 'price_asc':
          sortBy = 'price';
          sortOrder = 'asc';
          break;
        case 'price_desc':
          sortBy = 'price';
          sortOrder = 'desc';
          break;
      }

      // Get products
      const productsResult = await ProductModel.findByCategory(id, {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        isActive: true
      });

      // Translate products if needed
      if (language && language !== 'en') {
        productsResult.data = await Promise.all(
          productsResult.data.map(async (product) => {
            const translated = await TranslationModel.getProductWithTranslation(product.id, language);
            return translated || product;
          })
        );
      }

      res.json({
        success: true,
        data: {
          category,
          products: productsResult.data,
          pagination: productsResult.pagination
        }
      });
    } catch (error) {
      console.error('Error fetching category with products:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch category with products',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Create new category
  async createCategory(req, res) {
    try {

      const categoryData = req.body;
      const category = await CategoryModel.create(categoryData);

      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully'
      });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create category',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update category
  async updateCategory(req, res) {
    try {

      const { id } = req.params;
      const updateData = req.body;

      // Check if category exists
      const existingCategory = await CategoryModel.findById(id);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }

      const category = await CategoryModel.update(id, updateData);

      res.json({
        success: true,
        data: category,
        message: 'Category updated successfully'
      });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update category',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete category
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      // Check if category exists
      const existingCategory = await CategoryModel.findById(id);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }

      // Check if category has products
      const productCount = await ProductModel.countByCategory(id);
      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete category with products',
          details: `This category contains ${productCount} products. Please move or delete the products first.`
        });
      }

      await CategoryModel.delete(id);

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete category',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Toggle category active status
  async toggleCategoryStatus(req, res) {
    try {
      const { id } = req.params;

      // Check if category exists
      const existingCategory = await CategoryModel.findById(id);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }

      const category = await CategoryModel.update(id, {
        isActive: !existingCategory.isActive
      });

      res.json({
        success: true,
        data: category,
        message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error toggling category status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to toggle category status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get category statistics
  async getCategoryStats(req, res) {
    try {
      const { id } = req.params;

      // Check if category exists
      const category = await CategoryModel.findById(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }

      // Get stats
      const totalProducts = await ProductModel.countByCategory(id);
      const activeProducts = await ProductModel.countByCategory(id, { isActive: true });
      const inactiveProducts = totalProducts - activeProducts;

      // Get recent products
      const recentProducts = await ProductModel.findByCategory(id, {
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      res.json({
        success: true,
        data: {
          category: {
            id: category.id,
            name: category.name,
            isActive: category.isActive
          },
          stats: {
            totalProducts,
            activeProducts,
            inactiveProducts
          },
          recentProducts: recentProducts.data
        }
      });
    } catch (error) {
      console.error('Error fetching category stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch category statistics',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new CategoriesController();