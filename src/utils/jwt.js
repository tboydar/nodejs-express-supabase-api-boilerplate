const jwt = require('jsonwebtoken');
const config = require('../config');

class JWTUtils {
  // Generate access token (short-lived)
  static generateAccessToken(payload) {
    return jwt.sign(
      payload,
      config.jwtSecret,
      {
        expiresIn: config.jwtExpiresIn || '15m',
        issuer: 'ecommerce-demo-api',
        audience: 'ecommerce-demo-client',
      }
    );
  }
  
  // Generate refresh token (long-lived)
  static generateRefreshToken(payload) {
    return jwt.sign(
      payload,
      config.jwtRefreshSecret || config.jwtSecret,
      {
        expiresIn: config.jwtRefreshExpiresIn || '7d',
        issuer: 'ecommerce-demo-api',
        audience: 'ecommerce-demo-client',
      }
    );
  }
  
  // Verify access token
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret, {
        issuer: 'ecommerce-demo-api',
        audience: 'ecommerce-demo-client',
      });
    } catch (error) {
      throw new Error(`Invalid access token: ${error.message}`);
    }
  }
  
  // Verify refresh token
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.jwtRefreshSecret || config.jwtSecret, {
        issuer: 'ecommerce-demo-api',
        audience: 'ecommerce-demo-client',
      });
    } catch (error) {
      throw new Error(`Invalid refresh token: ${error.message}`);
    }
  }
  
  // Generate token pair (access + refresh)
  static generateTokenPair(payload) {
    const tokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    
    return {
      accessToken: this.generateAccessToken(tokenPayload),
      refreshToken: this.generateRefreshToken({ userId: payload.userId }),
      expiresIn: config.jwtExpiresIn || '15m',
      tokenType: 'Bearer',
    };
  }
  
  // Extract token from Authorization header
  static extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      throw new Error('Authorization header is missing');
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Invalid authorization header format. Expected: Bearer <token>');
    }
    
    return parts[1];
  }
  
  // Decode token without verification (for debugging)
  static decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      throw new Error(`Failed to decode token: ${error.message}`);
    }
  }
  
  // Check if token is expired
  static isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }
  
  // Get token expiration time
  static getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        return null;
      }
      
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }
}

module.exports = JWTUtils;