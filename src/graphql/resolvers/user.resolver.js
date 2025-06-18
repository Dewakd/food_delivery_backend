    // File: src/graphql/resolvers/user.resolver.js

import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateToken, getUserFromToken } from '../../utils/auth.js';
import { GraphQLError } from 'graphql';

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    getAllUsers: async (_, __, { user }) => {
      // Only admins or restaurant owners can see all users
      if (!user || (user.role !== 'Restaurant' && user.role !== 'Driver')) {
        throw new GraphQLError('Unauthorized access', {
          extensions: { code: 'FORBIDDEN' }
        });
      }
      
      return await prisma.uSER.findMany({
        orderBy: { createdAt: 'desc' }
      });
    },

    me: async (_, __, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to access this', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      
      return await prisma.uSER.findUnique({
        where: { penggunaId: user.penggunaId }
      });
    },

    getUserById: async (_, { id }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const targetUser = await prisma.uSER.findUnique({
        where: { penggunaId: parseInt(id) }
      });

      if (!targetUser) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'USER_NOT_FOUND' }
        });
      }

      // Users can only see their own profile, unless they're restaurant/driver
      if (user.penggunaId !== parseInt(id) && user.role === 'Customer') {
        throw new GraphQLError('Unauthorized access', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return targetUser;
    },

    getUsersByRole: async (_, { role }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can access this', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return await prisma.uSER.findMany({
        where: { role },
        orderBy: { createdAt: 'desc' }
      });
    },

    searchUsers: async (_, { searchTerm }, { user }) => {
      if (!user || user.role === 'Customer') {
        throw new GraphQLError('Unauthorized access', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return await prisma.uSER.findMany({
        where: {
          OR: [
            { namaPengguna: { contains: searchTerm } },
            { email: { contains: searchTerm } },
            { telepon: { contains: searchTerm } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
    },
  },

  Mutation: {
    registerUser: async (_, { email, namaPengguna, password, role, telepon, alamat }) => {
      // Check if user already exists
      const existingUser = await prisma.uSER.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        throw new GraphQLError('User with this email already exists', {
          extensions: { code: 'USER_ALREADY_EXISTS' }
        });
      }

      // Validate password strength
      if (password.length < 6) {
        throw new GraphQLError('Password must be at least 6 characters long', {
          extensions: { code: 'WEAK_PASSWORD' }
        });
      }

      // Hash password before saving
      const hashedPassword = await hashPassword(password);
      
      // Create new user
      const newUser = await prisma.uSER.create({
        data: {
          email,
          namaPengguna,
          password: hashedPassword,
          role,
          telepon,
          alamat,
        },
      });

      // Generate JWT token
      const token = generateToken({
        penggunaId: newUser.penggunaId,
        email: newUser.email,
        role: newUser.role
      });

      return {
        token,
        user: newUser
      };
    },
    
    loginUser: async (_, { email, password }) => {
      // Find user by email
      const user = await prisma.uSER.findUnique({
        where: { email }
      });

      if (!user) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'INVALID_CREDENTIALS' }
        });
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password);
      
      if (!isValidPassword) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'INVALID_CREDENTIALS' }
        });
      }

      // Generate JWT token
      const token = generateToken({
        penggunaId: user.penggunaId,
        email: user.email,
        role: user.role
      });

      return {
        token,
        user
      };
    },

    updateProfile: async (_, { input }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Update user profile
      const updatedUser = await prisma.uSER.update({
        where: { penggunaId: user.penggunaId },
        data: {
          ...input,
          updatedAt: new Date()
        }
      });

      return updatedUser;
    },

    changePassword: async (_, { input }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Get current user with password
      const currentUser = await prisma.uSER.findUnique({
        where: { penggunaId: user.penggunaId }
      });

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(
        input.currentPassword, 
        currentUser.password
      );

      if (!isCurrentPasswordValid) {
        throw new GraphQLError('Current password is incorrect', {
          extensions: { code: 'INVALID_PASSWORD' }
        });
      }

      // Validate new password
      if (input.newPassword.length < 6) {
        throw new GraphQLError('New password must be at least 6 characters long', {
          extensions: { code: 'WEAK_PASSWORD' }
        });
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(input.newPassword);

      // Update password
      await prisma.uSER.update({
        where: { penggunaId: user.penggunaId },
        data: {
          password: hashedNewPassword,
          updatedAt: new Date()
        }
      });

      return true;
    },

    deleteUser: async (_, { id }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const targetUserId = parseInt(id);

      // Users can only delete their own account, unless they're restaurant owner
      if (user.penggunaId !== targetUserId && user.role !== 'Restaurant') {
        throw new GraphQLError('Unauthorized to delete this user', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      // Check if user exists
      const targetUser = await prisma.uSER.findUnique({
        where: { penggunaId: targetUserId }
      });

      if (!targetUser) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'USER_NOT_FOUND' }
        });
      }

      // Delete user
      await prisma.uSER.delete({
        where: { penggunaId: targetUserId }
      });

      return true;
    },

    updateUserRole: async (_, { id, role }, { user }) => {
      // Only restaurant owners can change user roles
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can change user roles', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const targetUserId = parseInt(id);

      // Check if target user exists
      const targetUser = await prisma.uSER.findUnique({
        where: { penggunaId: targetUserId }
      });

      if (!targetUser) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'USER_NOT_FOUND' }
        });
      }

      // Update user role
      const updatedUser = await prisma.uSER.update({
        where: { penggunaId: targetUserId },
        data: {
          role,
          updatedAt: new Date()
        }
      });

      return updatedUser;
    },
  },
};
    