// Authentication test helpers
const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const UserModel = require('../../src/models/users');
const { testData } = require('../setup');

// Create test user and return auth token
async function createTestUser(userData = testData.user) {
  const user = await UserModel.create(userData);
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    config.jwtSecret,
    { expiresIn: '24h' }
  );
  
  return { user, token };
}

// Create test admin and return auth token
async function createTestAdmin(userData = testData.admin) {
  const admin = await UserModel.create(userData);
  const token = jwt.sign(
    { 
      id: admin.id, 
      email: admin.email, 
      role: admin.role 
    },
    config.jwtSecret,
    { expiresIn: '24h' }
  );
  
  return { user: admin, token };
}

// Generate JWT token for existing user
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    config.jwtSecret,
    { expiresIn: '24h' }
  );
}

// Create authorization header
function createAuthHeader(token) {
  return `Bearer ${token}`;
}

module.exports = {
  createTestUser,
  createTestAdmin,
  generateToken,
  createAuthHeader
};