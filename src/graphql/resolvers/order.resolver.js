
import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    getAllOrders: async (_, { filter, sortBy, limit = 50, offset = 0 }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can access all orders', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const where = {
        ...(filter?.status && { status: filter.status }),
        ...(filter?.restoranId && { restoranId: parseInt(filter.restoranId) }),
        ...(filter?.penggunaId && { penggunaId: parseInt(filter.penggunaId) }),
        ...(filter?.pengemudiId && { pengemudiId: parseInt(filter.pengemudiId) }),
        ...(filter?.metodePembayaran && { metodePembayaran: filter.metodePembayaran }),
        ...(filter?.minTotal && { jumlahTotal: { gte: filter.minTotal } }),
        ...(filter?.maxTotal && { jumlahTotal: { lte: filter.maxTotal } }),
        ...(filter?.dateFrom && filter?.dateTo && {
          tanggalPesanan: {
            gte: new Date(filter.dateFrom),
            lte: new Date(filter.dateTo)
          }
        })
      };

      let orderBy = {};
      switch (sortBy) {
        case 'DATE_ASC':
          orderBy = { tanggalPesanan: 'asc' };
          break;
        case 'DATE_DESC':
          orderBy = { tanggalPesanan: 'desc' };
          break;
        case 'TOTAL_ASC':
          orderBy = { jumlahTotal: 'asc' };
          break;
        case 'TOTAL_DESC':
          orderBy = { jumlahTotal: 'desc' };
          break;
        case 'STATUS_ASC':
          orderBy = { status: 'asc' };
          break;
        case 'STATUS_DESC':
          orderBy = { status: 'desc' };
          break;
        case 'CREATED_AT_ASC':
          orderBy = { createdAt: 'asc' };
          break;
        case 'CREATED_AT_DESC':
        default:
          orderBy = { createdAt: 'desc' };
          break;
      }

      return await prisma.oRDER.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      });
    },

    getOrderById: async (_, { id }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const order = await prisma.oRDER.findUnique({
        where: { pesananId: parseInt(id) },
      });

      if (!order) {
        throw new GraphQLError('Order not found', {
          extensions: { code: 'ORDER_NOT_FOUND' }
        });
      }

      if (user.role === 'Customer' && order.penggunaId !== user.penggunaId) {
        throw new GraphQLError('You can only access your own orders', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return order;
    },

    getMyOrders: async (_, { limit = 20, offset = 0 }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      let where = {};
      
      if (user.role === 'Customer') {
        where.penggunaId = user.penggunaId;
      }
      else if (user.role === 'Driver') {
        where.pengemudiId = { not: null };
      }
      else if (user.role === 'Restaurant') {
        where = {};
      }

      return await prisma.oRDER.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
    },

    getActiveOrders: async (_, __, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      let where = {
        status: { in: ['pending', 'confirmed', 'preparing', 'ready', 'delivering'] }
      };

      if (user.role === 'Customer') {
        where.penggunaId = user.penggunaId;
      } else if (user.role === 'Driver') {
        where.pengemudiId = { not: null };
      }

      return await prisma.oRDER.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
    },

    getPendingOrders: async (_, __, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can see pending orders', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return await prisma.oRDER.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' }
      });
    },

    getOrderHistory: async (_, { limit = 50, offset = 0 }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      let where = {
        status: { in: ['completed', 'cancelled'] }
      };

      if (user.role === 'Customer') {
        where.penggunaId = user.penggunaId;
      }

      return await prisma.oRDER.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
    },

    getOrderStats: async (_, { restoranId, driverId, dateFrom, dateTo }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      let where = {};
      
      if (restoranId) where.restoranId = parseInt(restoranId);
      if (driverId) where.pengemudiId = parseInt(driverId);
      if (dateFrom && dateTo) {
        where.tanggalPesanan = {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        };
      }

      const totalOrders = await prisma.oRDER.count({ where });
      const completedOrders = await prisma.oRDER.count({ 
        where: { ...where, status: 'completed' } 
      });
      const cancelledOrders = await prisma.oRDER.count({ 
        where: { ...where, status: 'cancelled' } 
      });
      const pendingOrders = await prisma.oRDER.count({ 
        where: { ...where, status: 'pending' } 
      });

      const revenueResult = await prisma.oRDER.aggregate({
        where: { ...where, status: 'completed' },
        _sum: { jumlahTotal: true }
      });

      const totalRevenue = revenueResult._sum.jumlahTotal || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        completedOrders,
        cancelledOrders,
        pendingOrders
      };
    },
  },

  Mutation: {
    createOrder: async (_, { input }, { user }) => {
      if (!user || user.role !== 'Customer') {
        throw new GraphQLError('Only customers can create orders', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const restaurant = await prisma.rESTAURANT.findUnique({
        where: { restoranId: parseInt(input.restoranId) }
      });

      if (!restaurant) {
        throw new GraphQLError('Restaurant not found', {
          extensions: { code: 'RESTAURANT_NOT_FOUND' }
        });
      }

      let totalCost = 0;
      const orderItems = [];

      for (const item of input.items) {
        const menuItem = await prisma.mENU_ITEM.findUnique({
          where: { itemMenuId: parseInt(item.itemMenuId) }
        });

        if (!menuItem) {
          throw new GraphQLError(`Menu item with ID ${item.itemMenuId} not found`, {
            extensions: { code: 'MENU_ITEM_NOT_FOUND' }
          });
        }

        if (!menuItem.isAvailable) {
          throw new GraphQLError(`Menu item ${menuItem.nama} is not available`, {
            extensions: { code: 'MENU_ITEM_UNAVAILABLE' }
          });
        }

        const itemTotal = menuItem.harga * item.quantity;
        totalCost += itemTotal;

        orderItems.push({
          itemMenuId: parseInt(item.itemMenuId),
          quantity: item.quantity,
          instruksiKhusus: item.instruksiKhusus,
          hargaSatuan: menuItem.harga,
          totalHarga: itemTotal
        });
      }

      const biayaOngkir = restaurant.biayaAntar || 0;
      const biayaLayanan = totalCost * 0.05; // 5% service fee
      const totalBiaya = totalCost + biayaOngkir + biayaLayanan;

      const order = await prisma.oRDER.create({
        data: {
          penggunaId: user.penggunaId,
          restoranId: parseInt(input.restoranId),
          alamatAntar: input.alamatAntar,
          metodePembayaran: input.metodePembayaran,
          catatanPesanan: input.catatanPesanan,
          jumlahTotal: totalCost,
          biayaOngkir,
          biayaLayanan,
          totalBiaya,
          status: 'pending',
          items: {
            create: orderItems
          }
        }
      });

      return order;
    },



    confirmOrder: async (_, { orderId, estimasiWaktu }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can confirm orders', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const order = await prisma.oRDER.findUnique({
        where: { pesananId: parseInt(orderId) }
      });

      if (!order) {
        throw new GraphQLError('Order not found', {
          extensions: { code: 'ORDER_NOT_FOUND' }
        });
      }

      if (order.status !== 'pending') {
        throw new GraphQLError('Order cannot be confirmed in current status', {
          extensions: { code: 'INVALID_ORDER_STATUS' }
        });
      }

      return await prisma.oRDER.update({
        where: { pesananId: parseInt(orderId) },
        data: {
          status: 'confirmed',
          estimasiWaktu,
          updatedAt: new Date()
        }
      });
    },

    updateOrderStatus: async (_, { input }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const order = await prisma.oRDER.findUnique({
        where: { pesananId: parseInt(input.orderId) }
      });

      if (!order) {
        throw new GraphQLError('Order not found', {
          extensions: { code: 'ORDER_NOT_FOUND' }
        });
      }

      if (input.status === 'preparing' && user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can set order to preparing', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      if (['delivering', 'completed'].includes(input.status) && user.role !== 'Driver') {
        throw new GraphQLError('Only drivers can set delivery status', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return await prisma.oRDER.update({
        where: { pesananId: parseInt(input.orderId) },
        data: {
          status: input.status,
          estimasiWaktu: input.estimasiWaktu,
          updatedAt: new Date()
        }
      });
    },

    cancelOrder: async (_, { orderId, reason }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const order = await prisma.oRDER.findUnique({
        where: { pesananId: parseInt(orderId) }
      });

      if (!order) {
        throw new GraphQLError('Order not found', {
          extensions: { code: 'ORDER_NOT_FOUND' }
        });
      }

      if (user.role === 'Customer' && (order.penggunaId !== user.penggunaId || order.status !== 'pending')) {
        throw new GraphQLError('You can only cancel your own pending orders', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return await prisma.oRDER.update({
        where: { pesananId: parseInt(orderId) },
        data: {
          status: 'cancelled',
          catatanPesanan: reason ? `${order.catatanPesanan || ''} [Cancelled: ${reason}]` : order.catatanPesanan,
          updatedAt: new Date()
        }
      });
    },

    rejectOrder: async (_, { orderId, reason }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can reject orders', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const order = await prisma.oRDER.findUnique({
        where: { pesananId: parseInt(orderId) }
      });

      if (!order) {
        throw new GraphQLError('Order not found', {
          extensions: { code: 'ORDER_NOT_FOUND' }
        });
      }

      if (order.status !== 'pending') {
        throw new GraphQLError('Order cannot be rejected in current status', {
          extensions: { code: 'INVALID_ORDER_STATUS' }
        });
      }

      return await prisma.oRDER.update({
        where: { pesananId: parseInt(orderId) },
        data: {
          status: 'cancelled',
          catatanPesanan: reason ? `${order.catatanPesanan || ''} [Rejected by restaurant: ${reason}]` : order.catatanPesanan,
          updatedAt: new Date()
        }
      });
    },

    acceptDelivery: async (_, { orderId }, { user }) => {
      if (!user || user.role !== 'Driver') {
        throw new GraphQLError('Only drivers can accept delivery', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const order = await prisma.oRDER.findUnique({
        where: { pesananId: parseInt(orderId) }
      });

      if (!order) {
        throw new GraphQLError('Order not found', {
          extensions: { code: 'ORDER_NOT_FOUND' }
        });
      }

      if (order.status !== 'ready') {
        throw new GraphQLError('Order is not ready for delivery', {
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

      return await prisma.oRDER.update({
        where: { pesananId: parseInt(orderId) },
        data: {
          pengemudiId: drivers[0].pengemudiId,
          status: 'delivering',
          updatedAt: new Date()
        }
      });
    },

  },

  Order: {
    pengguna: async (parent) => {
      if (!parent.penggunaId) return null;
      return await prisma.uSER.findUnique({
        where: { penggunaId: parent.penggunaId }
      });
    },

    restoran: async (parent) => {
      if (!parent.restoranId) return null;
      return await prisma.rESTAURANT.findUnique({
        where: { restoranId: parent.restoranId }
      });
    },

    pengemudi: async (parent) => {
      if (!parent.pengemudiId) return null;
      return await prisma.dELIVERY_DRIVER.findUnique({
        where: { pengemudiId: parent.pengemudiId }
      });
    },

    items: async (parent) => {
      return await prisma.oRDER_ITEM.findMany({
        where: { pesananId: parent.pesananId },
        orderBy: { createdAt: 'asc' }
      });
    },

    totalItems: async (parent) => {
      const result = await prisma.oRDER_ITEM.aggregate({
        where: { pesananId: parent.pesananId },
        _sum: { quantity: true }
      });
      return result._sum.quantity || 0;
    }
  }
}; 