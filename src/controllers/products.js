const ProductModel = require('../models/products');
const CategoryModel = require('../models/categories');
const TranslationModel = require('../models/translations');

class ProductsController {
  // Get all products with pagination and filters
  async getProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 12,
        q: search,
        category: categoryId,
        sort = 'newest',
        minPrice,
        maxPrice,
        isActive = true,
        fields
      } = req.query;

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
        case 'newest':
        default:
          sortBy = 'createdAt';
          sortOrder = 'desc';
          break;
      }

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        categoryId,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        sortBy,
        sortOrder,
        isActive: isActive === 'false' ? false : true,
        fields: fields ? fields.split(',') : undefined
      };

      const result = await ProductModel.findMany(filters);

      // If language is specified, get translations
      const language = req.language || req.headers['accept-language'] || 'en';
      if (language && language !== 'en') {
        result.data = await Promise.all(
          result.data.map(async (product) => {
            const translated = await TranslationModel.getProductWithTranslation(product.id, language);
            return translated || product;
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
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch products',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get product by ID
  async getProduct(req, res) {
    try {
      const { id } = req.params;
      const language = req.language || req.headers['accept-language'] || 'en';

      let product;
      if (language && language !== 'en') {
        product = await TranslationModel.getProductWithTranslation(id, language);
      } else {
        product = await ProductModel.findById(id);
      }

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      // Get category information if exists
      if (product.categoryId) {
        let category;
        if (language && language !== 'en') {
          category = await TranslationModel.getCategoryWithTranslation(product.categoryId, language);
        } else {
          category = await CategoryModel.findById(product.categoryId);
        }
        product.category = category;
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch product',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get products by category
  async getProductsByCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const {
        page = 1,
        limit = 12,
        sort = 'newest',
        isActive = true
      } = req.query;

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

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        isActive: isActive === 'false' ? false : true
      };

      const result = await ProductModel.findByCategory(categoryId, filters);

      // If language is specified, get translations
      const language = req.language || req.headers['accept-language'] || 'en';
      if (language && language !== 'en') {
        result.data = await Promise.all(
          result.data.map(async (product) => {
            const translated = await TranslationModel.getProductWithTranslation(product.id, language);
            return translated || product;
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
      console.error('Error fetching products by category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch products by category',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Create new product
  async createProduct(req, res) {
    try {

      const productData = req.body;

      // Check if category exists (if provided)
      if (productData.categoryId) {
        const category = await CategoryModel.findById(productData.categoryId);
        if (!category) {
          return res.status(400).json({
            success: false,
            error: 'Category not found'
          });
        }
      }

      const product = await ProductModel.create(productData);

      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully'
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create product',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update product
  async updateProduct(req, res) {
    try {

      const { id } = req.params;
      const updateData = req.body;

      // Check if product exists
      const existingProduct = await ProductModel.findById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      // Check if category exists (if provided)
      if (updateData.categoryId) {
        const category = await CategoryModel.findById(updateData.categoryId);
        if (!category) {
          return res.status(400).json({
            success: false,
            error: 'Category not found'
          });
        }
      }

      const product = await ProductModel.update(id, updateData);

      res.json({
        success: true,
        data: product,
        message: 'Product updated successfully'
      });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update product',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete product
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      // Check if product exists
      const existingProduct = await ProductModel.findById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      await ProductModel.delete(id);

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete product',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Toggle product active status
  async toggleProductStatus(req, res) {
    try {
      const { id } = req.params;

      // Check if product exists
      const existingProduct = await ProductModel.findById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      const product = await ProductModel.update(id, {
        isActive: !existingProduct.isActive
      });

      res.json({
        success: true,
        data: product,
        message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error toggling product status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to toggle product status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Search products
  async searchProducts(req, res) {
    try {
      const { q: query, limit = 10 } = req.query;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const result = await ProductModel.findMany({
        search: query.trim(),
        limit: parseInt(limit),
        isActive: true,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      // If language is specified, get translations
      const language = req.language || req.headers['accept-language'] || 'en';
      if (language && language !== 'en') {
        result.data = await Promise.all(
          result.data.map(async (product) => {
            const translated = await TranslationModel.getProductWithTranslation(product.id, language);
            return translated || product;
          })
        );
      }

      res.json({
        success: true,
        data: result.data,
        meta: {
          query: query.trim(),
          total: result.data.length,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search products',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new ProductsController();