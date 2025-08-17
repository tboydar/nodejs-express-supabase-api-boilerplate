require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // Supabase
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-fallback-secret-key',
  jwtExpiresIn: '7d',
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  
  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  uploadPath: process.env.UPLOAD_PATH || 'uploads/',
  
  // API
  apiVersion: 'v1',
  apiPrefix: '/api/v1',
};

// Validation
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
if (config.nodeEnv === 'production') {
  requiredEnvVars.push('SUPABASE_URL', 'SUPABASE_ANON_KEY');
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is missing`);
  }
}

module.exports = config;