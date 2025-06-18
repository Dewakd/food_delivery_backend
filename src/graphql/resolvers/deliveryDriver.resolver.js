import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    getAllDrivers: async (_, { filter, sortBy, limit = 50, offset = 0 }, { user }) => {
      // Only restaurant owners can see all drivers
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can access all drivers', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      // Build where clause for filtering
      const where = {
        ...(filter?.status && { status: filter.status }),
        ...(filter?.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter?.minRating && { rating: { gte: filter.minRating } })
      };

      // Build orderBy clause for sorting
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

      // In a real app, you'd link driver profile to user account
      // For now, we'll find by some logic or create if not exists
      const drivers = await prisma.dELIVERY_DRIVER.findMany({
        where: { isActive: true }
      });

      // Return first driver for now (in real app, you'd have proper user-driver linking)
      return drivers[0] || null;
    },

    getAvailableDrivers: async (_, { limit = 20 }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can see available drivers', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return await prisma.dELIVERY_DRIVER.findMany({
        where: {
          status: 'Online',
          isActive: true
        },
        orderBy: { rating: 'desc' },
        take: limit
      });
    },

    getDriversByStatus: async (_, { status }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can filter drivers by status', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return await prisma.dELIVERY_DRIVER.findMany({
        where: {
          status,
          isActive: true
        },
        orderBy: { rating: 'desc' }
      });
    },

    searchDrivers: async (_, { searchTerm, limit = 20 }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can search drivers', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return await prisma.dELIVERY_DRIVER.findMany({
        where: {
          OR: [
            { namaPengemudi: { contains: searchTerm } },
            { telepon: { contains: searchTerm } },
            { detailKendaraan: { contains: searchTerm } }
          ],
          isActive: true
        },
        take: limit,
        orderBy: { rating: 'desc' }
      });
    },

    getDriverStats: async (_, { driverId }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const targetDriverId = parseInt(driverId);

      // Drivers can only see their own stats, restaurant owners can see all
      if (user.role !== 'Restaurant' && user.role !== 'Driver') {
        throw new GraphQLError('Unauthorized to view driver stats', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const driver = await prisma.dELIVERY_DRIVER.findUnique({
        where: { pengemudiId: targetDriverId }
      });

      if (!driver) {
        throw new GraphQLError('Driver not found', {
          extensions: { code: 'DRIVER_NOT_FOUND' }
        });
      }

      // Calculate stats (simplified version)
      const totalOrders = await prisma.oRDER.count({
        where: { pengemudiId: targetDriverId }
      });

      const completedOrders = await prisma.oRDER.count({
        where: {
          pengemudiId: targetDriverId,
          status: 'completed'
        }
      });

      return {
        totalDeliveries: driver.totalDeliveries,
        totalEarnings: totalOrders * 15000, // Simplified calculation
        averageRating: driver.rating || 0,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
        onlineHours: 8.5 // Simplified - would track actual online time
      };
    },

    getNearbyDrivers: async (_, { latitude, longitude, radius }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can find nearby drivers', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      // Simplified version - in real app, you'd use proper geospatial queries
      return await prisma.dELIVERY_DRIVER.findMany({
        where: {
          status: 'Online',
          isActive: true,
          lokasiSaatIni: { not: null }
        },
        orderBy: { rating: 'desc' }
      });
    },
  },

  Mutation: {
    // Driver profile management
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

      // In real app, you'd find driver by user ID
      // For now, we'll find the first active driver (simplified)
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

      // Find and delete driver profile
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

    // Driver status management
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

      // Update order status and driver status
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

      // Update order status
      await prisma.oRDER.update({
        where: { pesananId: parseInt(orderId) },
        data: { status: 'completed' }
      });

      // Update driver stats and status
      return await prisma.dELIVERY_DRIVER.update({
        where: { pengemudiId: drivers[0].pengemudiId },
        data: {
          status: 'Online',
          totalDeliveries: { increment: 1 },
          updatedAt: new Date()
        }
      });
    },

    // Location management
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

    // Admin operations (Restaurant role only)
    toggleDriverActiveStatus: async (_, { driverId }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can toggle driver status', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const driverIdInt = parseInt(driverId);

      const driver = await prisma.dELIVERY_DRIVER.findUnique({
        where: { pengemudiId: driverIdInt }
      });

      if (!driver) {
        throw new GraphQLError('Driver not found', {
          extensions: { code: 'DRIVER_NOT_FOUND' }
        });
      }

      return await prisma.dELIVERY_DRIVER.update({
        where: { pengemudiId: driverIdInt },
        data: {
          isActive: !driver.isActive,
          updatedAt: new Date()
        }
      });
    },

    assignOrderToDriver: async (_, { orderId, driverId }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can assign orders', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const orderIdInt = parseInt(orderId);
      const driverIdInt = parseInt(driverId);

      // Check if order and driver exist
      const order = await prisma.oRDER.findUnique({
        where: { pesananId: orderIdInt }
      });

      const driver = await prisma.dELIVERY_DRIVER.findUnique({
        where: { pengemudiId: driverIdInt }
      });

      if (!order) {
        throw new GraphQLError('Order not found', {
          extensions: { code: 'ORDER_NOT_FOUND' }
        });
      }

      if (!driver) {
        throw new GraphQLError('Driver not found', {
          extensions: { code: 'DRIVER_NOT_FOUND' }
        });
      }

      // Assign order to driver
      await prisma.oRDER.update({
        where: { pesananId: orderIdInt },
        data: { pengemudiId: driverIdInt }
      });

      return driver;
    },

    removeDriverFromOrder: async (_, { orderId }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can remove driver from order', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const orderIdInt = parseInt(orderId);

      await prisma.oRDER.update({
        where: { pesananId: orderIdInt },
        data: { pengemudiId: null }
      });

      return true;
    },

    // Bulk operations
    bulkUpdateDriverStatus: async (_, { driverIds, status }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can bulk update driver status', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const driverIdsInt = driverIds.map(id => parseInt(id));

      await prisma.dELIVERY_DRIVER.updateMany({
        where: {
          pengemudiId: { in: driverIdsInt }
        },
        data: {
          status,
          updatedAt: new Date()
        }
      });

      // Return updated drivers
      return await prisma.dELIVERY_DRIVER.findMany({
        where: {
          pengemudiId: { in: driverIdsInt }
        }
      });
    },
  },

  // Relation resolvers
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

    completedOrders: async (parent) => {
      return await prisma.oRDER.findMany({
        where: {
          pengemudiId: parent.pengemudiId,
          status: 'completed'
        },
        orderBy: { tanggalPesanan: 'desc' }
      });
    },

    earnings: async (parent) => {
      const totalOrders = await prisma.oRDER.count({
        where: {
          pengemudiId: parent.pengemudiId,
          status: 'completed'
        }
      });

      // Simplified calculation - 15,000 per delivery
      return totalOrders * 15000;
    }
  }
}; 