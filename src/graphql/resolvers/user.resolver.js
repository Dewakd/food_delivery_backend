    // File: src/graphql/resolvers/user.resolver.js

import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateToken, getUserFromToken } from '../../utils/auth.js';
import { GraphQLError } from 'graphql';

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    getAllUsers: async () => {
      return await prisma.uSER.findMany();
    },
    me: async (_, __, { user }) => {
      // Get current user from JWT token
      if (!user) {
        throw new GraphQLError('You must be logged in to access this', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      
      return await prisma.uSER.findUnique({
        where: { penggunaId: user.penggunaId }
      });
    },
  },
  Mutation: {
    registerUser: async (_, { email, namaPengguna, password, role }) => {
      // Check if user already exists
      const existingUser = await prisma.uSER.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        throw new GraphQLError('User with this email already exists', {
          extensions: { code: 'USER_ALREADY_EXISTS' }
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
  },
};
    