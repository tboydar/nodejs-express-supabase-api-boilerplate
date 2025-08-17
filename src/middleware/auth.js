const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { AppError, asyncHandler } = require('./errorHandler');
const config = require('../config');

const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized to access this route', 401));
  }

  try {
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    // Attach user to request object
    req.user = user;
    
    // Get user profile if available
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      req.userProfile = profile;
    } catch (profileError) {
      // Profile might not exist yet, that's okay
      req.userProfile = null;
    }

    next();
  } catch (error) {
    return next(new AppError('Not authorized to access this route', 401));
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.userProfile) {
      return next(new AppError('User profile not found. Please complete your profile.', 403));
    }

    if (!roles.includes(req.userProfile.role)) {
      return next(new AppError('Not authorized to access this route', 403));
    }

    next();
  };
};

const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = user;
        
        // Get user profile if available
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          req.userProfile = profile;
        } catch (profileError) {
          req.userProfile = null;
        }
      }
    } catch (error) {
      // Token is invalid, but we continue without authentication
    }
  }

  next();
});

// Alternative JWT-based authentication (for non-Supabase scenarios)
const authenticateJWT = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = { id: decoded.sub, email: decoded.email };
    req.userProfile = decoded.profile || null;
    next();
  } catch (error) {
    return next(new AppError('Not authorized to access this route', 401));
  }
});

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  authenticateJWT,
};