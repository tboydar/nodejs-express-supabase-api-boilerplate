const request = require('supertest');
const app = require('../../src/index');
const { testData } = require('../setup');
const { createTestUser, createAuthHeader } = require('../helpers/auth');

describe('Authentication API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = { ...testData.user };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.fullName).toBe(userData.fullName);
      expect(response.body.data.user.role).toBe('user');
      expect(response.body.data.tokens).toBeDefined();
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();

      // Password should not be returned
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com'
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testData.user,
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testData.user,
          password: '123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should prevent duplicate email registration', async () => {
      const userData = { ...testData.user };

      // Register first user
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      // Try to register with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already exists');
    });

    it('should handle phone number validation', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testData.user,
          phone: 'invalid-phone'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await request(app)
        .post('/api/v1/auth/register')
        .send(testData.user);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testData.user.email,
          password: testData.user.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testData.user.email);
      expect(response.body.data.tokens).toBeDefined();
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();

      // Password should not be returned
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@example.com',
          password: testData.user.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testData.user.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testData.user.email
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: testData.user.password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let userToken;
    let testUser;

    beforeEach(async () => {
      const result = await createTestUser();
      testUser = result.user;
      userToken = result.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', createAuthHeader(userToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.fullName).toBe(testUser.fullName);

      // Password should not be returned
      expect(response.body.data.password).toBeUndefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired token');
    });

    it('should reject malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    let userToken;
    let testUser;

    beforeEach(async () => {
      const result = await createTestUser();
      testUser = result.user;
      userToken = result.token;
    });

    it('should update user profile', async () => {
      const updateData = {
        fullName: 'Updated Name',
        phone: '+9876543210'
      };

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', createAuthHeader(userToken))
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fullName).toBe(updateData.fullName);
      expect(response.body.data.phone).toBe(updateData.phone);
      expect(response.body.data.email).toBe(testUser.email); // Should remain unchanged
    });

    it('should update password', async () => {
      const updateData = {
        password: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', createAuthHeader(userToken))
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Test login with new password
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: updateData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .send({ fullName: 'Updated Name' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate phone number', async () => {
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', createAuthHeader(userToken))
        .send({ phone: 'invalid-phone' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', createAuthHeader(userToken))
        .send({ password: '123' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should not allow email update', async () => {
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', createAuthHeader(userToken))
        .send({ email: 'newemail@example.com' })
        .expect(200);

      // Email should remain unchanged
      expect(response.body.data.email).toBe(testUser.email);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testData.user);

      refreshToken = response.body.data.tokens.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.accessToken).not.toBe(refreshToken);
    });

    it('should require refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid refresh token');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let userToken;
    let refreshToken;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testData.user);

      userToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
    });

    it('should logout user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', createAuthHeader(userToken))
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should work without refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', createAuthHeader(userToken))
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send(loginData);
      }

      // Next attempt should be rate limited
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(429);

      expect(response.body.error).toContain('Too many requests');
    });

    it('should rate limit registration attempts', async () => {
      // Make multiple registration attempts
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/v1/auth/register')
          .send({
            ...testData.user,
            email: `user${i}@example.com`
          });
      }

      // Next attempt should be rate limited
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testData.user,
          email: 'final@example.com'
        })
        .expect(429);

      expect(response.body.error).toContain('Too many requests');
    });
  });
});