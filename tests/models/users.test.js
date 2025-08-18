const UserModel = require('../../src/models/users');
const bcrypt = require('bcryptjs');
const { testData } = require('../setup');

describe('UserModel', () => {
  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const userData = { ...testData.user };
      const user = await UserModel.create(userData);
      
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.fullName).toBe(userData.fullName);
      expect(user.role).toBe(userData.role);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      
      // Password should be hashed
      expect(user.password).not.toBe(userData.password);
      expect(await bcrypt.compare(userData.password, user.password)).toBe(true);
    });

    it('should create user with default role "user"', async () => {
      const userData = { ...testData.user };
      delete userData.role;
      
      const user = await UserModel.create(userData);
      expect(user.role).toBe('user');
    });

    it('should throw error for duplicate email', async () => {
      const userData = { ...testData.user };
      
      await UserModel.create(userData);
      
      await expect(UserModel.create(userData)).rejects.toThrow();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const userData = { ...testData.user };
      const createdUser = await UserModel.create(userData);
      
      const foundUser = await UserModel.findByEmail(userData.email);
      
      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(createdUser.id);
      expect(foundUser.email).toBe(userData.email);
    });

    it('should return null for non-existent email', async () => {
      const user = await UserModel.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const userData = { ...testData.user };
      const createdUser = await UserModel.create(userData);
      
      const foundUser = await UserModel.findById(createdUser.id);
      
      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(createdUser.id);
      expect(foundUser.email).toBe(userData.email);
    });

    it('should return null for non-existent id', async () => {
      const user = await UserModel.findById('550e8400-e29b-41d4-a716-446655440000');
      expect(user).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const userData = { ...testData.user };
      const user = await UserModel.create(userData);
      
      const updateData = {
        fullName: 'Updated Name',
        phone: '+9876543210'
      };
      
      const updatedUser = await UserModel.update(user.id, updateData);
      
      expect(updatedUser.fullName).toBe(updateData.fullName);
      expect(updatedUser.phone).toBe(updateData.phone);
      expect(updatedUser.email).toBe(userData.email); // Should remain unchanged
    });

    it('should hash new password when updating', async () => {
      const userData = { ...testData.user };
      const user = await UserModel.create(userData);
      
      const newPassword = 'newpassword123';
      const updatedUser = await UserModel.update(user.id, { password: newPassword });
      
      expect(updatedUser.password).not.toBe(newPassword);
      expect(await bcrypt.compare(newPassword, updatedUser.password)).toBe(true);
    });

    it('should return null for non-existent user', async () => {
      const result = await UserModel.update('550e8400-e29b-41d4-a716-446655440000', {
        fullName: 'Updated Name'
      });
      
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const userData = { ...testData.user };
      const user = await UserModel.create(userData);
      
      const result = await UserModel.delete(user.id);
      expect(result).toBe(true);
      
      // Verify user is deleted
      const foundUser = await UserModel.findById(user.id);
      expect(foundUser).toBeNull();
    });

    it('should return false for non-existent user', async () => {
      const result = await UserModel.delete('550e8400-e29b-41d4-a716-446655440000');
      expect(result).toBe(false);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const userData = { ...testData.user };
      const user = await UserModel.create(userData);
      
      const isValid = await UserModel.verifyPassword(user.password, userData.password);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const userData = { ...testData.user };
      const user = await UserModel.create(userData);
      
      const isValid = await UserModel.verifyPassword(user.password, 'wrongpassword');
      expect(isValid).toBe(false);
    });
  });

  describe('findMany', () => {
    it('should return paginated users', async () => {
      // Create multiple users
      for (let i = 0; i < 5; i++) {
        await UserModel.create({
          ...testData.user,
          email: `user${i}@example.com`,
          fullName: `User ${i}`
        });
      }
      
      const result = await UserModel.findMany({ page: 1, limit: 3 });
      
      expect(result.data).toBeDefined();
      expect(result.data.length).toBe(3);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.totalPages).toBe(2);
    });

    it('should filter users by role', async () => {
      await UserModel.create({ ...testData.user, role: 'user' });
      await UserModel.create({ ...testData.admin, role: 'admin' });
      
      const result = await UserModel.findMany({ role: 'admin' });
      
      expect(result.data.length).toBe(1);
      expect(result.data[0].role).toBe('admin');
    });

    it('should search users by email or name', async () => {
      await UserModel.create({
        ...testData.user,
        email: 'john@example.com',
        fullName: 'John Doe'
      });
      await UserModel.create({
        ...testData.user,
        email: 'jane@example.com',
        fullName: 'Jane Smith'
      });
      
      const result = await UserModel.findMany({ search: 'john' });
      
      expect(result.data.length).toBe(1);
      expect(result.data[0].fullName).toBe('John Doe');
    });
  });
});