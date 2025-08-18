const UserModel = require('../models/users');
const JWTUtils = require('../utils/jwt');

class AuthController {
  // User registration
  async register(req, res) {
    try {
      const { email, password, fullName, phone } = req.body;
      
      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered',
          message: 'A user with this email address already exists'
        });
      }
      
      // Create new user
      const userData = {
        email,
        password,
        fullName,
        phone,
        role: 'customer', // Default role
        isActive: true,
        isEmailVerified: false
      };
      
      const user = await UserModel.create(userData);
      
      // Generate tokens
      const tokens = JWTUtils.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role
      });
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            isEmailVerified: user.isEmailVerified
          },
          tokens
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // User login
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Find user with password
      const user = await UserModel.findByEmail(email, true);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account disabled',
          message: 'Your account has been disabled. Please contact support.'
        });
      }
      
      // Verify password
      const isPasswordValid = await UserModel.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }
      
      // Update last login time
      await UserModel.updateLastLogin(user.id);
      
      // Generate tokens
      const tokens = JWTUtils.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          tokens
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // Refresh access token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token required',
          message: 'Please provide a refresh token'
        });
      }
      
      // Verify refresh token
      const decoded = JWTUtils.verifyRefreshToken(refreshToken);
      
      // Get user details
      const user = await UserModel.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
          message: 'User not found or account disabled'
        });
      }
      
      // Generate new tokens
      const tokens = JWTUtils.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role
      });
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: error.message
      });
    }
  }
  
  // Get current user profile
  async getProfile(req, res) {
    try {
      // User is already attached to req by authenticate middleware
      const user = req.user;
      
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            isEmailVerified: user.isEmailVerified,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // Update user profile
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { fullName, phone } = req.body;
      
      const updateData = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (phone !== undefined) updateData.phone = phone;
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No update data provided',
          message: 'Please provide at least one field to update'
        });
      }
      
      const updatedUser = await UserModel.update(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // Change password
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      // Get user with password
      const user = await UserModel.findByEmail(req.user.email, true);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Verify current password
      const isCurrentPasswordValid = await UserModel.verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid current password',
          message: 'The current password you entered is incorrect'
        });
      }
      
      // Change password
      await UserModel.changePassword(userId, newPassword);
      
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to change password',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // Verify email
  async verifyEmail(req, res) {
    try {
      const userId = req.user.id;
      
      // In a real application, you would verify a token sent via email
      // For demo purposes, we'll just mark the email as verified
      const result = await UserModel.verifyEmail(userId);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Email verified successfully',
        data: {
          isEmailVerified: result.isEmailVerified
        }
      });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Email verification failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // Logout (client-side token invalidation)
  async logout(req, res) {
    try {
      // In a real application, you might want to blacklist the token
      // For now, we'll just return a success message
      // The client should remove the token from storage
      
      res.json({
        success: true,
        message: 'Logged out successfully',
        note: 'Please remove the token from client storage'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // Validate token endpoint
  async validateToken(req, res) {
    try {
      // If we reach here, the token is valid (authenticate middleware passed)
      const user = req.user;
      
      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            isEmailVerified: user.isEmailVerified
          },
          tokenInfo: {
            expires: JWTUtils.getTokenExpiration(req.token)
          }
        }
      });
    } catch (error) {
      console.error('Token validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Token validation failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new AuthController();