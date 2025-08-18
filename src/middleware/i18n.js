const i18n = require('i18n');
const path = require('path');
const TranslationModel = require('../models/translations');

// Configure i18n
i18n.configure({
  locales: ['en', 'zh-TW', 'de'],
  defaultLocale: 'en',
  directory: path.join(__dirname, '..', '..', 'locales'),
  cookie: 'lang',
  queryParameter: 'lang',
  header: 'accept-language',
  autoReload: true,
  updateFiles: false,
  syncFiles: false,
  objectNotation: true,
  logDebugFn: function (msg) {
    if (process.env.NODE_ENV === 'development') {
      console.log('i18n debug:', msg);
    }
  },
  logWarnFn: function (msg) {
    console.warn('i18n warning:', msg);
  },
  logErrorFn: function (msg) {
    console.error('i18n error:', msg);
  },
});

// Language detection and setup middleware
const detectLanguage = async (req, res, next) => {
  try {
    // Priority order for language detection:
    // 1. URL parameter /:lang
    // 2. Query parameter ?lang=
    // 3. Cookie
    // 4. Accept-Language header
    // 5. Default language

    let detectedLang = req.params.lang || 
                      req.query.lang || 
                      req.cookies.lang || 
                      req.acceptsLanguages(['en', 'zh-TW', 'de']) || 
                      'en';

    // Validate language code
    const isSupported = await TranslationModel.isLanguageSupported(detectedLang);
    if (!isSupported) {
      const defaultLang = await TranslationModel.getDefaultLanguage();
      detectedLang = defaultLang.code;
    }

    // Set language for i18n
    req.setLocale(detectedLang);
    res.locals.locale = detectedLang;
    res.locals.language = detectedLang;

    // Store language in cookie if it came from URL or query
    if (req.params.lang || req.query.lang) {
      res.cookie('lang', detectedLang, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }

    // Add language info to response locals for templates
    const supportedLanguages = await TranslationModel.getSupportedLanguages();
    res.locals.supportedLanguages = supportedLanguages;
    res.locals.currentLanguage = supportedLanguages.find(lang => lang.code === detectedLang);

    // Add translation helpers to response locals
    res.locals.__ = res.__;
    res.locals.__n = res.__n;
    res.locals.getLocalizedUrl = (path, lang) => {
      const targetLang = lang || detectedLang;
      return targetLang === 'en' ? path : `/${targetLang}${path}`;
    };

    // Store detected language in request for API responses
    req.language = detectedLang;

    next();
  } catch (error) {
    console.error('Language detection error:', error);
    // Fallback to default language
    req.setLocale('en');
    res.locals.locale = 'en';
    res.locals.language = 'en';
    req.language = 'en';
    next();
  }
};

// Middleware to redirect root path to default language
const redirectToDefaultLanguage = (req, res, next) => {
  // Only redirect if path is exactly / and no language parameter is set
  if (req.path === '/' && !req.query.lang) {
    const lang = req.cookies.lang || 
                req.acceptsLanguages(['en', 'zh-TW', 'de']) || 
                'en';
    
    // Redirect to language-specific URL
    if (lang !== 'en') {
      return res.redirect(`/${lang}/`);
    }
    // For English, keep the root path
    return res.redirect('/en/');
  }
  next();
};

// Middleware to set language-specific meta tags
const setLanguageMeta = (req, res, next) => {
  const currentLang = res.locals.language || 'en';
  const supportedLangs = res.locals.supportedLanguages || [];
  
  // Build alternate language links for SEO
  const alternateLinks = supportedLangs.map(lang => {
    const url = res.locals.getLocalizedUrl(req.path.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, ''), lang.code);
    return {
      hreflang: lang.code,
      href: `${req.protocol}://${req.get('host')}${url}`
    };
  });

  res.locals.alternateLinks = alternateLinks;
  res.locals.canonicalUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  
  next();
};

// API response language middleware
const apiLanguageSupport = async (req, res, next) => {
  // For API endpoints, detect language but don't redirect
  let apiLang = req.query.lang || 
               req.get('Accept-Language')?.split(',')[0]?.split('-')[0] || 
               'en';

  // Validate API language
  const isSupported = await TranslationModel.isLanguageSupported(apiLang);
  if (!isSupported) {
    apiLang = 'en';
  }

  req.apiLanguage = apiLang;
  
  // Add language info to API response
  const originalJson = res.json;
  res.json = function(data) {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      data.meta = data.meta || {};
      data.meta.language = apiLang;
      data.meta.availableLanguages = ['en', 'zh-TW', 'de'];
    }
    return originalJson.call(this, data);
  };

  next();
};

// Export configured i18n instance and middleware
module.exports = {
  i18n,
  detectLanguage,
  redirectToDefaultLanguage,
  setLanguageMeta,
  apiLanguageSupport,
};