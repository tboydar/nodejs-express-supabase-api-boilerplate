const { db } = require('../src/config/drizzle');
const { 
  categories, 
  products, 
  categoryTranslations, 
  productTranslations,
  supportedLanguages 
} = require('../src/models/schema');
const { v4: uuidv4 } = require('uuid');

const seedData = {
  // Supported languages (already inserted in migration)
  languages: [
    { code: 'en', name: 'English', nativeName: 'English', isActive: true, isDefault: true },
    { code: 'zh-TW', name: 'Traditional Chinese', nativeName: '正體中文', isActive: true, isDefault: false },
    { code: 'de', name: 'German', nativeName: 'Deutsch', isActive: true, isDefault: false }
  ],

  // Categories with translations
  categories: [
    {
      id: uuidv4(),
      name: 'Electronics', // Default English name
      description: 'Electronic devices and gadgets',
      imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300',
      translations: {
        'en': {
          name: 'Electronics',
          description: 'Electronic devices and gadgets',
          metaTitle: 'Electronics - Latest Gadgets and Devices',
          metaDescription: 'Shop the latest electronic devices, smartphones, laptops, and tech gadgets'
        },
        'zh-TW': {
          name: '電子產品',
          description: '電子設備和小工具',
          metaTitle: '電子產品 - 最新科技設備',
          metaDescription: '購買最新電子設備、智慧型手機、筆記型電腦和科技小工具'
        },
        'de': {
          name: 'Elektronik',
          description: 'Elektronische Geräte und Gadgets',
          metaTitle: 'Elektronik - Neueste Geräte und Gadgets',
          metaDescription: 'Kaufen Sie die neuesten elektronischen Geräte, Smartphones, Laptops und Tech-Gadgets'
        }
      }
    },
    {
      id: uuidv4(),
      name: 'Clothing',
      description: 'Fashion and apparel',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300',
      translations: {
        'en': {
          name: 'Clothing',
          description: 'Fashion and apparel',
          metaTitle: 'Clothing - Fashion and Apparel',
          metaDescription: 'Discover trendy clothing, fashion accessories, and apparel for all occasions'
        },
        'zh-TW': {
          name: '服飾',
          description: '時尚與服裝',
          metaTitle: '服飾 - 時尚與服裝',
          metaDescription: '探索時尚服裝、配件和各種場合的服飾'
        },
        'de': {
          name: 'Kleidung',
          description: 'Mode und Bekleidung',
          metaTitle: 'Kleidung - Mode und Bekleidung',
          metaDescription: 'Entdecken Sie trendige Kleidung, Mode-Accessoires und Bekleidung für alle Anlässe'
        }
      }
    },
    {
      id: uuidv4(),
      name: 'Books',
      description: 'Books and educational materials',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      translations: {
        'en': {
          name: 'Books',
          description: 'Books and educational materials',
          metaTitle: 'Books - Educational and Entertainment Reading',
          metaDescription: 'Browse our collection of books, educational materials, and reading content'
        },
        'zh-TW': {
          name: '書籍',
          description: '書籍和教育材料',
          metaTitle: '書籍 - 教育與娛樂閱讀',
          metaDescription: '瀏覽我們的書籍、教育材料和閱讀內容收藏'
        },
        'de': {
          name: 'Bücher',
          description: 'Bücher und Bildungsmaterialien',
          metaTitle: 'Bücher - Bildungs- und Unterhaltungslektüre',
          metaDescription: 'Durchsuchen Sie unsere Sammlung von Büchern, Bildungsmaterialien und Leseinhalten'
        }
      }
    },
    {
      id: uuidv4(),
      name: 'Home & Garden',
      description: 'Home improvement and garden supplies',
      imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300',
      translations: {
        'en': {
          name: 'Home & Garden',
          description: 'Home improvement and garden supplies',
          metaTitle: 'Home & Garden - Home Improvement and Gardening',
          metaDescription: 'Find everything for home improvement, gardening, and outdoor living'
        },
        'zh-TW': {
          name: '居家園藝',
          description: '家居改善和園藝用品',
          metaTitle: '居家園藝 - 家居改善與園藝',
          metaDescription: '尋找家居改善、園藝和戶外生活的所有用品'
        },
        'de': {
          name: 'Haus & Garten',
          description: 'Heimwerker- und Gartenbedarf',
          metaTitle: 'Haus & Garten - Heimwerken und Gärtnern',
          metaDescription: 'Finden Sie alles für Heimwerken, Gärtnern und das Leben im Freien'
        }
      }
    }
  ],

  // Products with translations
  products: []
};

// Generate products for each category
const generateProducts = () => {
  const productTemplates = {
    'Electronics': [
      {
        name: 'Smartphone Pro Max',
        description: 'Latest flagship smartphone with advanced features',
        price: 999.99,
        stockQuantity: 50,
        sku: 'PHONE-001',
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        weight: 0.2,
        translations: {
          'en': {
            name: 'Smartphone Pro Max',
            description: 'Latest flagship smartphone with advanced camera system, 5G connectivity, and all-day battery life. Perfect for professionals and tech enthusiasts.',
            metaTitle: 'Smartphone Pro Max - Latest Flagship Phone',
            metaDescription: 'Buy the latest Smartphone Pro Max with advanced features, 5G, and professional camera system'
          },
          'zh-TW': {
            name: '智慧型手機 Pro Max',
            description: '最新旗艦智慧型手機，具備先進相機系統、5G 連接性和全天候電池續航力。專業人士和科技愛好者的完美選擇。',
            metaTitle: '智慧型手機 Pro Max - 最新旗艦手機',
            metaDescription: '購買最新智慧型手機 Pro Max，具備先進功能、5G 和專業相機系統'
          },
          'de': {
            name: 'Smartphone Pro Max',
            description: 'Neuestes Flaggschiff-Smartphone mit fortschrittlichem Kamerasystem, 5G-Konnektivität und ganztägiger Akkulaufzeit. Perfekt für Profis und Technik-Enthusiasten.',
            metaTitle: 'Smartphone Pro Max - Neuestes Flaggschiff-Telefon',
            metaDescription: 'Kaufen Sie das neueste Smartphone Pro Max mit erweiterten Funktionen, 5G und professionellem Kamerasystem'
          }
        }
      },
      {
        name: 'Wireless Earbuds',
        description: 'Premium noise-cancelling wireless earbuds',
        price: 199.99,
        stockQuantity: 100,
        sku: 'AUDIO-001',
        imageUrl: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400',
        weight: 0.05,
        translations: {
          'en': {
            name: 'Wireless Earbuds',
            description: 'Premium noise-cancelling wireless earbuds with superior sound quality and comfortable fit for all-day use.',
            metaTitle: 'Wireless Earbuds - Premium Audio Experience',
            metaDescription: 'Experience premium audio with noise-cancelling wireless earbuds'
          },
          'zh-TW': {
            name: '無線耳機',
            description: '頂級降噪無線耳機，具備優異音質和舒適配戴感，適合全天候使用。',
            metaTitle: '無線耳機 - 頂級音頻體驗',
            metaDescription: '體驗頂級降噪無線耳機帶來的優質音頻'
          },
          'de': {
            name: 'Kabellose Ohrhörer',
            description: 'Premium-Ohrhörer mit Geräuschunterdrückung, überlegener Klangqualität und komfortabler Passform für ganztägigen Gebrauch.',
            metaTitle: 'Kabellose Ohrhörer - Premium Audio-Erlebnis',
            metaDescription: 'Erleben Sie Premium-Audio mit geräuschunterdrückenden kabellosen Ohrhörern'
          }
        }
      },
      {
        name: 'Gaming Laptop',
        description: 'High-performance gaming laptop for professionals',
        price: 1499.99,
        stockQuantity: 25,
        sku: 'LAPTOP-001',
        imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
        weight: 2.5,
        translations: {
          'en': {
            name: 'Gaming Laptop Pro',
            description: 'High-performance gaming laptop with latest GPU, fast processor, and RGB keyboard. Perfect for gaming and professional work.',
            metaTitle: 'Gaming Laptop Pro - High Performance Computing',
            metaDescription: 'Ultimate gaming laptop with latest GPU and high-performance specs'
          },
          'zh-TW': {
            name: '遊戲筆電 Pro',
            description: '高效能遊戲筆記型電腦，配備最新 GPU、快速處理器和 RGB 鍵盤。遊戲和專業工作的完美選擇。',
            metaTitle: '遊戲筆電 Pro - 高效能運算',
            metaDescription: '終極遊戲筆電，配備最新 GPU 和高效能規格'
          },
          'de': {
            name: 'Gaming Laptop Pro',
            description: 'Hochleistungs-Gaming-Laptop mit neuester GPU, schnellem Prozessor und RGB-Tastatur. Perfekt für Gaming und professionelle Arbeit.',
            metaTitle: 'Gaming Laptop Pro - Hochleistungs-Computing',
            metaDescription: 'Ultimativer Gaming-Laptop mit neuester GPU und Hochleistungsspezifikationen'
          }
        }
      }
    ],
    'Clothing': [
      {
        name: 'Classic T-Shirt',
        description: 'Comfortable cotton t-shirt for everyday wear',
        price: 29.99,
        stockQuantity: 200,
        sku: 'SHIRT-001',
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        weight: 0.2,
        translations: {
          'en': {
            name: 'Classic Cotton T-Shirt',
            description: 'Comfortable 100% cotton t-shirt perfect for everyday casual wear. Available in multiple colors and sizes.',
            metaTitle: 'Classic Cotton T-Shirt - Comfortable Everyday Wear',
            metaDescription: 'Shop comfortable 100% cotton t-shirts in various colors and sizes'
          },
          'zh-TW': {
            name: '經典棉質 T 恤',
            description: '舒適的 100% 棉質 T 恤，非常適合日常休閒穿著。多種顏色和尺寸可選。',
            metaTitle: '經典棉質 T 恤 - 舒適日常穿著',
            metaDescription: '購買舒適的 100% 棉質 T 恤，多種顏色和尺寸'
          },
          'de': {
            name: 'Klassisches Baumwoll-T-Shirt',
            description: 'Bequemes 100% Baumwoll-T-Shirt, perfekt für den täglichen Freizeitlook. In verschiedenen Farben und Größen erhältlich.',
            metaTitle: 'Klassisches Baumwoll-T-Shirt - Bequeme Alltagskleidung',
            metaDescription: 'Kaufen Sie bequeme 100% Baumwoll-T-Shirts in verschiedenen Farben und Größen'
          }
        }
      },
      {
        name: 'Denim Jeans',
        description: 'Premium denim jeans with modern fit',
        price: 79.99,
        stockQuantity: 75,
        sku: 'JEANS-001',
        imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
        weight: 0.6,
        translations: {
          'en': {
            name: 'Premium Denim Jeans',
            description: 'High-quality denim jeans with modern slim fit. Crafted from premium cotton blend for comfort and durability.',
            metaTitle: 'Premium Denim Jeans - Modern Style and Comfort',
            metaDescription: 'Shop premium denim jeans with modern fit and superior quality'
          },
          'zh-TW': {
            name: '頂級牛仔褲',
            description: '高品質牛仔褲，現代修身版型。採用頂級棉混紡面料，兼具舒適性和耐用性。',
            metaTitle: '頂級牛仔褲 - 現代風格與舒適',
            metaDescription: '購買頂級牛仔褲，現代版型和卓越品質'
          },
          'de': {
            name: 'Premium Denim Jeans',
            description: 'Hochwertige Denim-Jeans mit moderner schlanker Passform. Aus Premium-Baumwollmischung für Komfort und Langlebigkeit gefertigt.',
            metaTitle: 'Premium Denim Jeans - Moderner Stil und Komfort',
            metaDescription: 'Kaufen Sie Premium-Denim-Jeans mit moderner Passform und überlegener Qualität'
          }
        }
      }
    ],
    'Books': [
      {
        name: 'Web Development Guide',
        description: 'Comprehensive guide to modern web development',
        price: 49.99,
        stockQuantity: 120,
        sku: 'BOOK-001',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
        weight: 0.5,
        translations: {
          'en': {
            name: 'Complete Web Development Guide',
            description: 'Comprehensive guide covering modern web development technologies including HTML5, CSS3, JavaScript, React, and Node.js.',
            metaTitle: 'Complete Web Development Guide - Learn Modern Web Tech',
            metaDescription: 'Master modern web development with this comprehensive guide'
          },
          'zh-TW': {
            name: '完整網頁開發指南',
            description: '全面涵蓋現代網頁開發技術的指南，包括 HTML5、CSS3、JavaScript、React 和 Node.js。',
            metaTitle: '完整網頁開發指南 - 學習現代網頁技術',
            metaDescription: '透過這本全面指南掌握現代網頁開發'
          },
          'de': {
            name: 'Vollständiger Webentwicklungs-Leitfaden',
            description: 'Umfassender Leitfaden zu modernen Webentwicklungstechnologien einschließlich HTML5, CSS3, JavaScript, React und Node.js.',
            metaTitle: 'Vollständiger Webentwicklungs-Leitfaden - Moderne Web-Technologien lernen',
            metaDescription: 'Meistern Sie moderne Webentwicklung mit diesem umfassenden Leitfaden'
          }
        }
      }
    ],
    'Home & Garden': [
      {
        name: 'Smart Garden Kit',
        description: 'Automated indoor gardening system',
        price: 149.99,
        stockQuantity: 30,
        sku: 'GARDEN-001',
        imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
        weight: 2.0,
        translations: {
          'en': {
            name: 'Smart Indoor Garden Kit',
            description: 'Automated indoor gardening system with LED grow lights and app control. Perfect for growing herbs and vegetables year-round.',
            metaTitle: 'Smart Indoor Garden Kit - Automated Growing System',
            metaDescription: 'Grow fresh herbs and vegetables indoors with smart automated gardening'
          },
          'zh-TW': {
            name: '智慧室內園藝套件',
            description: '自動化室內園藝系統，配備 LED 植物燈和應用程式控制。全年種植香草和蔬菜的完美選擇。',
            metaTitle: '智慧室內園藝套件 - 自動化種植系統',
            metaDescription: '使用智慧自動化園藝在室內種植新鮮香草和蔬菜'
          },
          'de': {
            name: 'Smart Indoor Garten-Set',
            description: 'Automatisiertes Indoor-Gartensystem mit LED-Wachstumslichtern und App-Steuerung. Perfekt für den ganzjährigen Anbau von Kräutern und Gemüse.',
            metaTitle: 'Smart Indoor Garten-Set - Automatisiertes Anbausystem',
            metaDescription: 'Züchten Sie frische Kräuter und Gemüse drinnen mit smart automatisiertem Gärtnern'
          }
        }
      }
    ]
  };

  // Generate products for each category
  seedData.categories.forEach(category => {
    const categoryProducts = productTemplates[category.name] || [];
    categoryProducts.forEach(productTemplate => {
      const productId = uuidv4();
      seedData.products.push({
        id: productId,
        categoryId: category.id,
        ...productTemplate
      });
    });
  });
};

generateProducts();

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (in reverse order due to foreign keys)
    console.log('🧹 Clearing existing data...');
    await db.delete(productTranslations);
    await db.delete(categoryTranslations);
    await db.delete(products);
    await db.delete(categories);

    // Seed categories
    console.log('📂 Seeding categories...');
    for (const categoryData of seedData.categories) {
      const { translations, ...categoryBase } = categoryData;
      
      // Insert base category
      await db.insert(categories).values({
        id: categoryBase.id,
        name: categoryBase.name,
        description: categoryBase.description,
        imageUrl: categoryBase.imageUrl,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Insert category translations
      for (const [langCode, translation] of Object.entries(translations)) {
        await db.insert(categoryTranslations).values({
          id: uuidv4(),
          categoryId: categoryBase.id,
          languageCode: langCode,
          name: translation.name,
          description: translation.description,
          metaTitle: translation.metaTitle,
          metaDescription: translation.metaDescription,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Seed products
    console.log('📦 Seeding products...');
    for (const productData of seedData.products) {
      const { translations, ...productBase } = productData;
      
      // Insert base product
      await db.insert(products).values({
        id: productBase.id,
        name: productBase.name,
        description: productBase.description,
        price: productBase.price.toString(),
        stockQuantity: productBase.stockQuantity,
        categoryId: productBase.categoryId,
        imageUrl: productBase.imageUrl,
        images: JSON.stringify([]),
        sku: productBase.sku,
        isActive: true,
        weight: productBase.weight?.toString() || null,
        dimensions: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Insert product translations
      for (const [langCode, translation] of Object.entries(translations)) {
        await db.insert(productTranslations).values({
          id: uuidv4(),
          productId: productBase.id,
          languageCode: langCode,
          name: translation.name,
          description: translation.description,
          metaTitle: translation.metaTitle,
          metaDescription: translation.metaDescription,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Seeded ${seedData.categories.length} categories and ${seedData.products.length} products`);
    console.log('🌍 Each item has translations in English, Traditional Chinese, and German');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = {
  seedDatabase,
  seedData
};