
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateToken, getUserFromToken } from '../../utils/auth.js';
import { GraphQLError } from 'graphql';

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    getAllUsers: async (_, __, { user }) => {
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
      const existingUser = await prisma.uSER.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        throw new GraphQLError('User with this email already exists', {
          extensions: { code: 'USER_ALREADY_EXISTS' }
        });
      }

      if (password.length < 6) {
        throw new GraphQLError('Password must be at least 6 characters long', {
          extensions: { code: 'WEAK_PASSWORD' }
        });
      }

      const hashedPassword = await hashPassword(password);
      
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
      const user = await prisma.uSER.findUnique({
        where: { email }
      });

      if (!user) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'INVALID_CREDENTIALS' }
        });
      }

      const isValidPassword = await comparePassword(password, user.password);
      
      if (!isValidPassword) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'INVALID_CREDENTIALS' }
        });
      }

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

      const currentUser = await prisma.uSER.findUnique({
        where: { penggunaId: user.penggunaId }
      });

      if (!currentUser) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'USER_NOT_FOUND' }
        });
      }

      const isValidPassword = await comparePassword(input.currentPassword, currentUser.password);
      
      if (!isValidPassword) {
        throw new GraphQLError('Current password is incorrect', {
          extensions: { code: 'INVALID_CURRENT_PASSWORD' }
        });
      }

      if (input.newPassword.length < 6) {
        throw new GraphQLError('New password must be at least 6 characters long', {
          extensions: { code: 'WEAK_PASSWORD' }
        });
      }

      const hashedNewPassword = await hashPassword(input.newPassword);

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

      if (user.penggunaId !== targetUserId && user.role !== 'Restaurant') {
        throw new GraphQLError('Unauthorized to delete this user', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const targetUser = await prisma.uSER.findUnique({
        where: { penggunaId: targetUserId }
      });

      if (!targetUser) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'USER_NOT_FOUND' }
        });
      }

      await prisma.uSER.delete({
        where: { penggunaId: targetUserId }
      });

      return true;
    },

    updateUserRole: async (_, { id, role }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can change user roles', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const targetUserId = parseInt(id);

      const targetUser = await prisma.uSER.findUnique({
        where: { penggunaId: targetUserId }
      });

      if (!targetUser) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'USER_NOT_FOUND' }
        });
      }

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

  User: {
    restaurants: async (parent) => {
      if (parent.role !== 'Restaurant') {
        return [];
      }
      
      return await prisma.rESTAURANT.findMany({
        where: { ownerId: parent.penggunaId },
        orderBy: { createdAt: 'desc' }
      });
    }
  }
};
    