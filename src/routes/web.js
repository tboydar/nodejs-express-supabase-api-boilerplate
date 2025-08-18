const express = require('express');
const { detectLanguage, setLanguageMeta } = require('../middleware/i18n');
const TranslationModel = require('../models/translations');
const ProductModel = require('../models/products');
const CategoryModel = require('../models/categories');

const router = express.Router();

// Apply language detection and meta setup to all routes
router.use(detectLanguage);
router.use(setLanguageMeta);

// Helper function to get translated products
async function getTranslatedProducts(products, language) {
    return Promise.all(products.map(async (product) => {
        const translated = await TranslationModel.getProductWithTranslation(product.id, language);
        return translated || product;
    }));
}

// Helper function to get translated categories
async function getTranslatedCategories(categories, language) {
    return Promise.all(categories.map(async (category) => {
        const translated = await TranslationModel.getCategoryWithTranslation(category.id, language);
        return translated || category;
    }));
}

// Home page - supports /:lang? pattern
router.get(['/', '/:lang(en|zh-TW|de)/'], async (req, res) => {
    try {
        const language = res.locals.language;
        
        // Get featured categories (limit 6)
        const categoriesResult = await CategoryModel.findMany({ 
            limit: 6, 
            isActive: true 
        });
        const categories = await getTranslatedCategories(categoriesResult.data, language);
        
        // Get featured products (limit 8)
        const productsResult = await ProductModel.findMany({ 
            limit: 8, 
            isActive: true,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });
        const featuredProducts = await getTranslatedProducts(productsResult.data, language);
        
        res.render('pages/home', {
            title: res.__('home.title'),
            description: res.__('site.description'),
            categories: categories,
            featuredProducts: featuredProducts,
            breadcrumbs: [
                { title: res.__('navigation.home'), url: res.locals.getLocalizedUrl('/') }
            ]
        });
    } catch (error) {
        console.error('Home page error:', error);
        res.status(500).render('pages/error', {
            title: res.__('errors.500'),
            message: res.__('errors.500'),
            error: error
        });
    }
});

// Products page
router.get(['/:lang(en|zh-TW|de)/products', '/products'], async (req, res) => {
    try {
        const language = res.locals.language;
        const {
            page = 1,
            limit = 12,
            q: search,
            category: categoryId,
            sort = 'newest',
            minPrice,
            maxPrice
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
        
        // Get products with filters
        const productsResult = await ProductModel.findMany({
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            categoryId,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            sortBy,
            sortOrder,
            isActive: true
        });
        
        // Translate products
        const products = await getTranslatedProducts(productsResult.data, language);
        
        // Get all categories for filter
        const categoriesResult = await CategoryModel.findMany({ isActive: true });
        const categories = await getTranslatedCategories(categoriesResult.data, language);
        
        res.render('pages/products', {
            title: res.__('products.title'),
            description: res.__('products.description'),
            products: products,
            categories: categories,
            pagination: productsResult.pagination,
            totalProducts: productsResult.pagination.total,
            query: search,
            selectedCategory: categoryId,
            currentSort: sort,
            breadcrumbs: [
                { title: res.__('navigation.home'), url: res.locals.getLocalizedUrl('/') },
                { title: res.__('navigation.products'), url: res.locals.getLocalizedUrl('/products') }
            ]
        });
    } catch (error) {
        console.error('Products page error:', error);
        res.status(500).render('pages/error', {
            title: res.__('errors.500'),
            message: res.__('errors.500'),
            error: error
        });
    }
});

// Product detail page
router.get(['/:lang(en|zh-TW|de)/products/:id', '/products/:id'], async (req, res) => {
    try {
        const language = res.locals.language;
        const productId = req.params.id;
        
        // Get product with translation
        const product = await TranslationModel.getProductWithTranslation(productId, language);
        
        if (!product || !product.isActive) {
            return res.status(404).render('pages/error', {
                title: res.__('errors.404'),
                message: res.__('errors.404'),
                error: { status: 404 }
            });
        }
        
        // Get category with translation if product has category
        let category = null;
        if (product.categoryId) {
            category = await TranslationModel.getCategoryWithTranslation(product.categoryId, language);
        }
        
        // Get related products from the same category
        let relatedProducts = [];
        if (product.categoryId) {
            const relatedResult = await ProductModel.findByCategory(product.categoryId, {
                limit: 4,
                isActive: true
            });
            relatedProducts = await getTranslatedProducts(
                relatedResult.data.filter(p => p.id !== productId),
                language
            );
        }
        
        res.render('pages/product-detail', {
            title: product.name,
            description: product.description,
            product: { ...product, category },
            relatedProducts: relatedProducts,
            breadcrumbs: [
                { title: res.__('navigation.home'), url: res.locals.getLocalizedUrl('/') },
                { title: res.__('navigation.products'), url: res.locals.getLocalizedUrl('/products') },
                { title: product.name, url: res.locals.getLocalizedUrl(`/products/${productId}`) }
            ]
        });
    } catch (error) {
        console.error('Product detail error:', error);
        res.status(500).render('pages/error', {
            title: res.__('errors.500'),
            message: res.__('errors.500'),
            error: error
        });
    }
});

// Categories page
router.get(['/:lang(en|zh-TW|de)/categories', '/categories'], async (req, res) => {
    try {
        const language = res.locals.language;
        
        // Get all categories
        const categoriesResult = await CategoryModel.findMany({ isActive: true });
        const categories = await getTranslatedCategories(categoriesResult.data, language);
        
        res.render('pages/categories', {
            title: res.__('navigation.categories'),
            description: 'Browse our product categories',
            categories: categories,
            breadcrumbs: [
                { title: res.__('navigation.home'), url: res.locals.getLocalizedUrl('/') },
                { title: res.__('navigation.categories'), url: res.locals.getLocalizedUrl('/categories') }
            ]
        });
    } catch (error) {
        console.error('Categories page error:', error);
        res.status(500).render('pages/error', {
            title: res.__('errors.500'),
            message: res.__('errors.500'),
            error: error
        });
    }
});

// Category products page
router.get(['/:lang(en|zh-TW|de)/categories/:id', '/categories/:id'], async (req, res) => {
    try {
        const language = res.locals.language;
        const categoryId = req.params.id;
        const { page = 1, limit = 12, sort = 'newest' } = req.query;
        
        // Get category with translation
        const category = await TranslationModel.getCategoryWithTranslation(categoryId, language);
        
        if (!category || !category.isActive) {
            return res.status(404).render('pages/error', {
                title: res.__('errors.404'),
                message: res.__('errors.404'),
                error: { status: 404 }
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
        
        // Get products in this category
        const productsResult = await ProductModel.findByCategory(categoryId, {
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy,
            sortOrder,
            isActive: true
        });
        
        // Translate products
        const products = await getTranslatedProducts(productsResult.data, language);
        
        res.render('pages/category-products', {
            title: `${category.name} - ${res.__('navigation.products')}`,
            description: category.description,
            category: category,
            products: products,
            pagination: productsResult.pagination,
            currentSort: sort,
            breadcrumbs: [
                { title: res.__('navigation.home'), url: res.locals.getLocalizedUrl('/') },
                { title: res.__('navigation.categories'), url: res.locals.getLocalizedUrl('/categories') },
                { title: category.name, url: res.locals.getLocalizedUrl(`/categories/${categoryId}`) }
            ]
        });
    } catch (error) {
        console.error('Category products error:', error);
        res.status(500).render('pages/error', {
            title: res.__('errors.500'),
            message: res.__('errors.500'),
            error: error
        });
    }
});

// Cart page
router.get(['/:lang(en|zh-TW|de)/cart', '/cart'], async (req, res) => {
    try {
        res.render('pages/cart', {
            title: res.__('cart.title'),
            description: 'Your shopping cart',
            breadcrumbs: [
                { title: res.__('navigation.home'), url: res.locals.getLocalizedUrl('/') },
                { title: res.__('cart.title'), url: res.locals.getLocalizedUrl('/cart') }
            ]
        });
    } catch (error) {
        console.error('Cart page error:', error);
        res.status(500).render('pages/error', {
            title: res.__('errors.500'),
            message: res.__('errors.500'),
            error: error
        });
    }
});

// Checkout page
router.get(['/:lang(en|zh-TW|de)/checkout', '/checkout'], async (req, res) => {
    try {
        res.render('pages/checkout', {
            title: res.__('checkout.title'),
            description: 'Complete your order',
            breadcrumbs: [
                { title: res.__('navigation.home'), url: res.locals.getLocalizedUrl('/') },
                { title: res.__('cart.title'), url: res.locals.getLocalizedUrl('/cart') },
                { title: res.__('checkout.title'), url: res.locals.getLocalizedUrl('/checkout') }
            ]
        });
    } catch (error) {
        console.error('Checkout page error:', error);
        res.status(500).render('pages/error', {
            title: res.__('errors.500'),
            message: res.__('errors.500'),
            error: error
        });
    }
});

// Orders page
router.get(['/:lang(en|zh-TW|de)/orders', '/orders'], async (req, res) => {
    try {
        res.render('pages/orders', {
            title: res.__('orders.title'),
            description: 'Your orders',
            breadcrumbs: [
                { title: res.__('navigation.home'), url: res.locals.getLocalizedUrl('/') },
                { title: res.__('orders.title'), url: res.locals.getLocalizedUrl('/orders') }
            ]
        });
    } catch (error) {
        console.error('Orders page error:', error);
        res.status(500).render('pages/error', {
            title: res.__('errors.500'),
            message: res.__('errors.500'),
            error: error
        });
    }
});

// Authentication pages
router.get(['/:lang(en|zh-TW|de)/auth/login', '/auth/login'], async (req, res) => {
    try {
        res.render('pages/auth/login', {
            title: res.__('auth.login'),
            description: 'Sign in to your account',
            breadcrumbs: [
                { title: res.__('navigation.home'), url: res.locals.getLocalizedUrl('/') },
                { title: res.__('auth.login'), url: res.locals.getLocalizedUrl('/auth/login') }
            ]
        });
    } catch (error) {
        console.error('Login page error:', error);
        res.status(500).render('pages/error', {
            title: res.__('errors.500'),
            message: res.__('errors.500'),
            error: error
        });
    }
});

router.get(['/:lang(en|zh-TW|de)/auth/register', '/auth/register'], async (req, res) => {
    try {
        res.render('pages/auth/register', {
            title: res.__('auth.register'),
            description: 'Create a new account',
            breadcrumbs: [
                { title: res.__('navigation.home'), url: res.locals.getLocalizedUrl('/') },
                { title: res.__('auth.register'), url: res.locals.getLocalizedUrl('/auth/register') }
            ]
        });
    } catch (error) {
        console.error('Register page error:', error);
        res.status(500).render('pages/error', {
            title: res.__('errors.500'),
            message: res.__('errors.500'),
            error: error
        });
    }
});

// Error page
router.get('/error', (req, res) => {
    res.render('pages/error', {
        title: res.__('errors.500'),
        message: res.__('errors.500'),
        error: { status: 500 }
    });
});

// 404 handler for unmatched routes
router.use((req, res) => {
    res.status(404).render('pages/error', {
        title: res.__('errors.404'),
        message: res.__('errors.404'),
        error: { status: 404 }
    });
});

module.exports = router;