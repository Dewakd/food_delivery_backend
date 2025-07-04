import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    getAllDrivers: async (_, { filter, sortBy, limit = 50, offset = 0 }, { user }) => {
      if (!user || user.role !== 'Admin') {
        throw new GraphQLError('Only platform administrators can access all drivers', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const where = {
        ...(filter?.status && { status: filter.status }),
        ...(filter?.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter?.minRating && { rating: { gte: filter.minRating } })
      };

      let orderBy = {};
      switch (sortBy) {
        case 'NAME_ASC':
          orderBy = { namaPengemudi: 'asc' };
          break;
        case 'NAME_DESC':
          orderBy = { namaPengemudi: 'desc' };
          break;
        case 'RATING_ASC':
          orderBy = { rating: 'asc' };
          break;
        case 'RATING_DESC':
          orderBy = { rating: 'desc' };
          break;
        case 'TOTAL_DELIVERIES_ASC':
          orderBy = { totalDeliveries: 'asc' };
          break;
        case 'TOTAL_DELIVERIES_DESC':
          orderBy = { totalDeliveries: 'desc' };
          break;
        case 'CREATED_AT_ASC':
          orderBy = { createdAt: 'asc' };
          break;
        case 'CREATED_AT_DESC':
        default:
          orderBy = { createdAt: 'desc' };
          break;
      }

      return await prisma.dELIVERY_DRIVER.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      });
    },

    getDriverById: async (_, { id }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const driver = await prisma.dELIVERY_DRIVER.findUnique({
        where: { pengemudiId: parseInt(id) },
      });

      if (!driver) {
        throw new GraphQLError('Driver not found', {
          extensions: { code: 'DRIVER_NOT_FOUND' }
        });
      }

      return driver;
    },

    getMyDriverProfile: async (_, __, { user }) => {
      if (!user || user.role !== 'Driver') {
        throw new GraphQLError('Only drivers can access their profile', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const drivers = await prisma.dELIVERY_DRIVER.findMany({
        where: { isActive: true }
      });

      return drivers[0] || null;
    },

    getAvailableOrders: async (_, { limit = 20 }, { user }) => {
      if (!user || user.role !== 'Driver') {
        throw new GraphQLError('Only drivers can see available orders', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return await prisma.oRDER.findMany({
        where: {
          status: 'ready',
          pengemudiId: null // Not assigned to any driver yet
        },
        orderBy: { updatedAt: 'asc' }, // First ready, first served
        take: limit
      });
    },

    getMyActiveDelivery: async (_, __, { user }) => {
      if (!user || user.role !== 'Driver') {
        throw new GraphQLError('Only drivers can see their active delivery', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const drivers = await prisma.dELIVERY_DRIVER.findMany({
        where: { isActive: true, status: 'Delivering' }
      });

      if (!drivers.length) return null;

      return await prisma.oRDER.findFirst({
        where: {
          pengemudiId: drivers[0].pengemudiId,
          status: 'delivering'
        }
      });
    },

    getMyDeliveryHistory: async (_, { limit = 50, offset = 0 }, { user }) => {
      if (!user || user.role !== 'Driver') {
        throw new GraphQLError('Only drivers can see their delivery history', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const drivers = await prisma.dELIVERY_DRIVER.findMany({
        where: { isActive: true }
      });

      if (!drivers.length) return [];

      return await prisma.oRDER.findMany({
        where: {
          pengemudiId: drivers[0].pengemudiId,
          status: { in: ['completed', 'cancelled'] }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset
      });
    },
  },

  Mutation: {
    createDriverProfile: async (_, { input }, { user }) => {
      if (!user || user.role !== 'Driver') {
        throw new GraphQLError('Only users with Driver role can create driver profile', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return await prisma.dELIVERY_DRIVER.create({
        data: {
          ...input,
          status: 'Offline',
          rating: 0,
          totalDeliveries: 0,
          isActive: true
        }
      });
    },

    updateDriverProfile: async (_, { input }, { user }) => {
      if (!user || user.role !== 'Driver') {
        throw new GraphQLError('Only drivers can update their profile', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const drivers = await prisma.dELIVERY_DRIVER.findMany({
        where: { isActive: true }
      });

      if (!drivers.length) {
        throw new GraphQLError('Driver profile not found', {
          extensions: { code: 'DRIVER_NOT_FOUND' }
        });
      }

      return await prisma.dELIVERY_DRIVER.update({
        where: { pengemudiId: drivers[0].pengemudiId },
        data: {
          ...input,
          updatedAt: new Date()
        }
      });
    },

    deleteDriverProfile: async (_, __, { user }) => {
      if (!user || user.role !== 'Driver') {
        throw new GraphQLError('Only drivers can delete their profile', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const drivers = await prisma.dELIVERY_DRIVER.findMany({
        where: { isActive: true }
      });

      if (!drivers.length) {
        throw new GraphQLError('Driver profile not found', {
          extensions: { code: 'DRIVER_NOT_FOUND' }
        });
      }

      await prisma.dELIVERY_DRIVER.delete({
        where: { pengemudiId: drivers[0].pengemudiId }
      });

      return true;
    },

    acceptOrder: async (_, { orderId }, { user }) => {
      if (!user || user.role !== 'Driver') {
        throw new GraphQLError('Only drivers can accept orders', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const orderIdInt = parseInt(orderId);

      const order = await prisma.oRDER.findUnique({
        where: { pesananId: orderIdInt }
      });

      if (!order) {
        throw new GraphQLError('Order not found', {
          extensions: { code: 'ORDER_NOT_FOUND' }
        });
      }

      if (order.status !== 'ready') {
        throw new GraphQLError('Order is not ready for pickup', {
          extensions: { code: 'ORDER_NOT_READY' }
        });
      }

      if (order.pengemudiId) {
        throw new GraphQLError('Order already assigned to another driver', {
          extensions: { code: 'ORDER_ALREADY_ASSIGNED' }
        });
      }

      const drivers = await prisma.dELIVERY_DRIVER.findMany({
        where: { isActive: true, status: 'Online' }
      });

      if (!drivers.length) {
        throw new GraphQLError('Driver profile not found or not online', {
          extensions: { code: 'DRIVER_NOT_AVAILABLE' }
        });
      }

      const driver = drivers[0];

      await prisma.oRDER.update({
        where: { pesananId: orderIdInt },
        data: {
          pengemudiId: driver.pengemudiId,
          status: 'delivering',
          updatedAt: new Date()
        }
      });

      await prisma.dELIVERY_DRIVER.update({
        where: { pengemudiId: driver.pengemudiId },
        data: {
          status: 'Delivering',
          updatedAt: new Date()
        }
      });

      return order;
    },

    updateDriverStatus: async (_, { status }, { user }) => {
      if (!user || user.role !== 'Driver') {
        throw new GraphQLError('Only drivers can update their status', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const drivers = await prisma.dELIVERY_DRIVER.findMany({
        where: { isActive: true }
      });

      if (!drivers.length) {
        throw new GraphQLError('Driver profile not found', {
          extensions: { code: 'DRIVER_NOT_FOUND' }
        });
      }

      return await prisma.dELIVERY_DRIVER.update({
        where: { pengemudiId: drivers[0].pengemudiId },
        data: {
          status,
          updatedAt: new Date()
        }
      });
    },

    goOnline: async (_, __, { user }) => {
      if (!user || user.role !== 'Driver') {
        throw new GraphQLError('Only drivers can go online', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const drivers = await prisma.dELIVERY_DRIVER.findMany({
        where: { isActive: true }
      });

      if (!drivers.length) {
        throw new GraphQLError('Driver profile not found', {
          extensions: { code: 'DRIVER_NOT_FOUND' }
        });
      }

      return await prisma.dELIVERY_DRIVER.update({
        where: { pengemudiId: drivers[0].pengemudiId },
        data: {
          status: 'Online',
          updatedAt: new Date()
        }
      });
    },

    goOffline: async (_, __, { user }) => {
      if (!user || user.role !== 'Driver') {
        throw new GraphQLError('Only drivers can go offline', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const drivers = await prisma.dELIVERY_DRIVER.findMany({
        where: { isActive: true }
      });

      if (!drivers.length) {
        throw new GraphQLError('Driver profile not found', {
          extensions: { code: 'DRIVER_NOT_FOUND' }
        });
      }

      return await prisma.dELIVERY_DRIVER.update({
        where: { pengemudiId: drivers[0].pengemudiId },
        data: {
          status: 'Offline',
          updatedAt: new Date()
        }
      });
    },

    startDelivery: async (_, { orderId }, { user }) => {
      if (!user || user.role !== 'Driver') {
        throw new GraphQLError('Only drivers can start delivery', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const drivers = await prisma.dELIVERY_DRIVER.findMany({
        where: { isActive: true }
      });

      if (!drivers.length) {
        throw new GraphQLError('Driver profile not found', {
          extensions: { code: 'DRIVER_NOT_FOUND' }
        });
      }

      await prisma.oRDER.update({
        where: { pesananId: parseInt(orderId) },
        data: { status: 'delivering' }
      });

      return await prisma.dELIVERY_DRIVER.update({
        where: { pengemudiId: drivers[0].pengemudiId },
        data: {
          status: 'Delivering',
          updatedAt: new Date()
        }
      });
    },

    completeDelivery: async (_, { orderId }, { user }) => {
      if (!user || user.role !== 'Driver') {
        throw new GraphQLError('Only drivers can complete delivery', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const drivers = await prisma.dELIVERY_DRIVER.findMany({
        where: { isActive: true }
      });

      if (!drivers.length) {
        throw new GraphQLError('Driver profile not found', {
          extensions: { code: 'DRIVER_NOT_FOUND' }
        });
      }

      await prisma.oRDER.update({
        where: { pesananId: parseInt(orderId) },
        data: { status: 'completed' }
      });

      return await prisma.dELIVERY_DRIVER.update({
        where: { pengemudiId: drivers[0].pengemudiId },
        data: {
          status: 'Online',
          totalDeliveries: { increment: 1 },
          updatedAt: new Date()
        }
      });
    },

    updateDriverLocation: async (_, { input }, { user }) => {
      if (!user || user.role !== 'Driver') {
        throw new GraphQLError('Only drivers can update their location', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const drivers = await prisma.dELIVERY_DRIVER.findMany({
        where: { isActive: true }
      });

      if (!drivers.length) {
        throw new GraphQLError('Driver profile not found', {
          extensions: { code: 'DRIVER_NOT_FOUND' }
        });
      }

      return await prisma.dELIVERY_DRIVER.update({
        where: { pengemudiId: drivers[0].pengemudiId },
        data: {
          lokasiSaatIni: input.lokasiSaatIni,
          updatedAt: new Date()
        }
      });
    },


  },

  DeliveryDriver: {
    orders: async (parent) => {
      return await prisma.oRDER.findMany({
        where: { pengemudiId: parent.pengemudiId },
        orderBy: { tanggalPesanan: 'desc' }
      });
    },

    activeOrder: async (parent) => {
      return await prisma.oRDER.findFirst({
        where: {
          pengemudiId: parent.pengemudiId,
          status: { in: ['preparing', 'delivering'] }
        }
      });
    },

    deliveryHistory: async (parent) => {
      return await prisma.oRDER.findMany({
        where: {
          pengemudiId: parent.pengemudiId,
          status: { in: ['completed', 'cancelled'] }
        },
        orderBy: { tanggalPesanan: 'desc' }
      });
    }
  }
}; 