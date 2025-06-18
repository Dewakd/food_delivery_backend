import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    getOrderItemById: async (_, { id }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const orderItem = await prisma.oRDER_ITEM.findUnique({
        where: { itemPesananId: parseInt(id) },
        include: {
          pesanan: true,
          menuItem: true
        }
      });

      if (!orderItem) {
        throw new GraphQLError('Order item not found', {
          extensions: { code: 'ORDER_ITEM_NOT_FOUND' }
        });
      }

      // Check if user can access this order item
      if (user.role === 'Customer' && orderItem.pesanan.penggunaId !== user.penggunaId) {
        throw new GraphQLError('You can only access your own order items', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return orderItem;
    },

    getOrderItemsByOrder: async (_, { orderId }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // First check if user can access this order
      const order = await prisma.oRDER.findUnique({
        where: { pesananId: parseInt(orderId) }
      });

      if (!order) {
        throw new GraphQLError('Order not found', {
          extensions: { code: 'ORDER_NOT_FOUND' }
        });
      }

      // Check permissions
      if (user.role === 'Customer' && order.penggunaId !== user.penggunaId) {
        throw new GraphQLError('You can only access your own order items', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return await prisma.oRDER_ITEM.findMany({
        where: { pesananId: parseInt(orderId) },
        orderBy: { createdAt: 'asc' }
      });
    },

    getOrderItemsByMenuItem: async (_, { menuItemId, limit = 50 }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can view menu item order history', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return await prisma.oRDER_ITEM.findMany({
        where: { itemMenuId: parseInt(menuItemId) },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    },

    getPopularOrderItems: async (_, { restoranId, limit = 10 }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can view popular items', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      // Get most ordered items for a restaurant
      const popularItems = await prisma.oRDER_ITEM.groupBy({
        by: ['itemMenuId'],
        where: {
          ...(restoranId && {
            menuItem: {
              restoranId: parseInt(restoranId)
            }
          })
        },
        _sum: {
          quantity: true
        },
        _count: {
          itemPesananId: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: limit
      });

      // Get the actual order items for these popular menu items
      const menuItemIds = popularItems.map(item => item.itemMenuId);
      
      return await prisma.oRDER_ITEM.findMany({
        where: {
          itemMenuId: { in: menuItemIds }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    },

    getOrderItemStats: async (_, { restoranId, dateFrom, dateTo }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can view order item statistics', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      let where = {};

      if (restoranId) {
        where.menuItem = {
          restoranId: parseInt(restoranId)
        };
      }

      if (dateFrom && dateTo) {
        where.createdAt = {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        };
      }

      const stats = await prisma.oRDER_ITEM.aggregate({
        where,
        _sum: {
          quantity: true,
          totalHarga: true
        },
        _count: {
          itemPesananId: true
        }
      });

      const totalQuantity = stats._sum.quantity || 0;
      const totalValue = stats._sum.totalHarga || 0;
      const totalOrderItems = stats._count.itemPesananId || 0;

      // Get popular items
      const popularItems = await prisma.mENU_ITEM.findMany({
        where: {
          ...(restoranId && { restoranId: parseInt(restoranId) }),
          orderItems: {
            some: {}
          }
        },
        take: 5,
        orderBy: {
          orderItems: {
            _count: 'desc'
          }
        }
      });

      const averageQuantityPerOrder = totalOrderItems > 0 ? totalQuantity / totalOrderItems : 0;

      return {
        totalQuantity,
        totalValue,
        popularItems,
        averageQuantityPerOrder
      };
    },
  },

  Mutation: {
    addItemToOrder: async (_, { input }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Check if order exists and user owns it
      const order = await prisma.oRDER.findUnique({
        where: { pesananId: parseInt(input.pesananId) }
      });

      if (!order) {
        throw new GraphQLError('Order not found', {
          extensions: { code: 'ORDER_NOT_FOUND' }
        });
      }

      // Only customers can add items to their own orders, and only if order is pending
      if (user.role === 'Customer') {
        if (order.penggunaId !== user.penggunaId) {
          throw new GraphQLError('You can only modify your own orders', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        if (order.status !== 'pending') {
          throw new GraphQLError('You can only modify pending orders', {
            extensions: { code: 'ORDER_NOT_MODIFIABLE' }
          });
        }
      }

      // Get menu item to validate and get price
      const menuItem = await prisma.mENU_ITEM.findUnique({
        where: { itemMenuId: parseInt(input.itemMenuId) }
      });

      if (!menuItem) {
        throw new GraphQLError('Menu item not found', {
          extensions: { code: 'MENU_ITEM_NOT_FOUND' }
        });
      }

      if (!menuItem.isAvailable) {
        throw new GraphQLError('Menu item is not available', {
          extensions: { code: 'MENU_ITEM_UNAVAILABLE' }
        });
      }

      const totalHarga = menuItem.harga * input.quantity;

      // Create order item
      const orderItem = await prisma.oRDER_ITEM.create({
        data: {
          pesananId: parseInt(input.pesananId),
          itemMenuId: parseInt(input.itemMenuId),
          quantity: input.quantity,
          instruksiKhusus: input.instruksiKhusus,
          hargaSatuan: menuItem.harga,
          totalHarga
        }
      });

      // Update order total
      await updateOrderTotal(parseInt(input.pesananId));

      return orderItem;
    },

    updateOrderItem: async (_, { id, input }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const orderItem = await prisma.oRDER_ITEM.findUnique({
        where: { itemPesananId: parseInt(id) },
        include: {
          pesanan: true,
          menuItem: true
        }
      });

      if (!orderItem) {
        throw new GraphQLError('Order item not found', {
          extensions: { code: 'ORDER_ITEM_NOT_FOUND' }
        });
      }

      // Check permissions
      if (user.role === 'Customer') {
        if (orderItem.pesanan.penggunaId !== user.penggunaId) {
          throw new GraphQLError('You can only modify your own order items', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        if (orderItem.pesanan.status !== 'pending') {
          throw new GraphQLError('You can only modify pending orders', {
            extensions: { code: 'ORDER_NOT_MODIFIABLE' }
          });
        }
      }

      // Update data
      const updateData = {};
      
      if (input.quantity !== undefined) {
        updateData.quantity = input.quantity;
        updateData.totalHarga = orderItem.hargaSatuan * input.quantity;
      }

      if (input.instruksiKhusus !== undefined) {
        updateData.instruksiKhusus = input.instruksiKhusus;
      }

      updateData.updatedAt = new Date();

      const updatedOrderItem = await prisma.oRDER_ITEM.update({
        where: { itemPesananId: parseInt(id) },
        data: updateData
      });

      // Update order total if quantity changed
      if (input.quantity !== undefined) {
        await updateOrderTotal(orderItem.pesananId);
      }

      return updatedOrderItem;
    },

    removeItemFromOrder: async (_, { id }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const orderItem = await prisma.oRDER_ITEM.findUnique({
        where: { itemPesananId: parseInt(id) },
        include: { pesanan: true }
      });

      if (!orderItem) {
        throw new GraphQLError('Order item not found', {
          extensions: { code: 'ORDER_ITEM_NOT_FOUND' }
        });
      }

      // Check permissions
      if (user.role === 'Customer') {
        if (orderItem.pesanan.penggunaId !== user.penggunaId) {
          throw new GraphQLError('You can only modify your own order items', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        if (orderItem.pesanan.status !== 'pending') {
          throw new GraphQLError('You can only modify pending orders', {
            extensions: { code: 'ORDER_NOT_MODIFIABLE' }
          });
        }
      }

      const pesananId = orderItem.pesananId;

      await prisma.oRDER_ITEM.delete({
        where: { itemPesananId: parseInt(id) }
      });

      // Update order total
      await updateOrderTotal(pesananId);

      return true;
    },

    addMultipleItemsToOrder: async (_, { pesananId, items }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Check order permissions
      const order = await prisma.oRDER.findUnique({
        where: { pesananId: parseInt(pesananId) }
      });

      if (!order) {
        throw new GraphQLError('Order not found', {
          extensions: { code: 'ORDER_NOT_FOUND' }
        });
      }

      if (user.role === 'Customer' && order.penggunaId !== user.penggunaId) {
        throw new GraphQLError('You can only modify your own orders', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const orderItems = [];

      for (const item of items) {
        const menuItem = await prisma.mENU_ITEM.findUnique({
          where: { itemMenuId: parseInt(item.itemMenuId) }
        });

        if (!menuItem || !menuItem.isAvailable) {
          continue; // Skip unavailable items
        }

        const totalHarga = menuItem.harga * item.quantity;

        orderItems.push({
          pesananId: parseInt(pesananId),
          itemMenuId: parseInt(item.itemMenuId),
          quantity: item.quantity,
          instruksiKhusus: item.instruksiKhusus,
          hargaSatuan: menuItem.harga,
          totalHarga
        });
      }

      // Create all order items
      const createdItems = await prisma.oRDER_ITEM.createMany({
        data: orderItems
      });

      // Update order total
      await updateOrderTotal(parseInt(pesananId));

      // Return the created items
      return await prisma.oRDER_ITEM.findMany({
        where: { pesananId: parseInt(pesananId) },
        orderBy: { createdAt: 'desc' },
        take: items.length
      });
    },

    removeMultipleItemsFromOrder: async (_, { itemIds }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const itemIdsInt = itemIds.map(id => parseInt(id));

      // Get order items to check permissions
      const orderItems = await prisma.oRDER_ITEM.findMany({
        where: { itemPesananId: { in: itemIdsInt } },
        include: { pesanan: true }
      });

      if (orderItems.length === 0) {
        throw new GraphQLError('No order items found', {
          extensions: { code: 'ORDER_ITEMS_NOT_FOUND' }
        });
      }

      // Check permissions for each order item
      if (user.role === 'Customer') {
        for (const orderItem of orderItems) {
          if (orderItem.pesanan.penggunaId !== user.penggunaId) {
            throw new GraphQLError('You can only modify your own order items', {
              extensions: { code: 'FORBIDDEN' }
            });
          }

          if (orderItem.pesanan.status !== 'pending') {
            throw new GraphQLError('You can only modify pending orders', {
              extensions: { code: 'ORDER_NOT_MODIFIABLE' }
            });
          }
        }
      }

      const pesananIds = [...new Set(orderItems.map(item => item.pesananId))];

      // Delete all order items
      await prisma.oRDER_ITEM.deleteMany({
        where: { itemPesananId: { in: itemIdsInt } }
      });

      // Update order totals for all affected orders
      for (const pesananId of pesananIds) {
        await updateOrderTotal(pesananId);
      }

      return true;
    },

    updateOrderItemQuantities: async (_, { updates }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const itemIds = updates.map(update => parseInt(update.itemPesananId));

      // Get order items to check permissions
      const orderItems = await prisma.oRDER_ITEM.findMany({
        where: { itemPesananId: { in: itemIds } },
        include: { pesanan: true }
      });

      if (orderItems.length === 0) {
        throw new GraphQLError('No order items found', {
          extensions: { code: 'ORDER_ITEMS_NOT_FOUND' }
        });
      }

      // Check permissions
      if (user.role === 'Customer') {
        for (const orderItem of orderItems) {
          if (orderItem.pesanan.penggunaId !== user.penggunaId) {
            throw new GraphQLError('You can only modify your own order items', {
              extensions: { code: 'FORBIDDEN' }
            });
          }

          if (orderItem.pesanan.status !== 'pending') {
            throw new GraphQLError('You can only modify pending orders', {
              extensions: { code: 'ORDER_NOT_MODIFIABLE' }
            });
          }
        }
      }

      const updatedItems = [];
      const pesananIds = new Set();

      // Update each order item
      for (const update of updates) {
        const orderItem = orderItems.find(item => item.itemPesananId === parseInt(update.itemPesananId));
        if (!orderItem) continue;

        const newTotalHarga = orderItem.hargaSatuan * update.quantity;
        
        const updated = await prisma.oRDER_ITEM.update({
          where: { itemPesananId: parseInt(update.itemPesananId) },
          data: {
            quantity: update.quantity,
            totalHarga: newTotalHarga,
            updatedAt: new Date()
          }
        });

        updatedItems.push(updated);
        pesananIds.add(orderItem.pesananId);
      }

      // Update order totals for all affected orders
      for (const pesananId of pesananIds) {
        await updateOrderTotal(pesananId);
      }

      return updatedItems;
    },
  },

  // Relation resolvers
  OrderItem: {
    pesanan: async (parent) => {
      return await prisma.oRDER.findUnique({
        where: { pesananId: parent.pesananId }
      });
    },

    menuItem: async (parent) => {
      if (!parent.itemMenuId) return null;
      return await prisma.mENU_ITEM.findUnique({
        where: { itemMenuId: parent.itemMenuId }
      });
    }
  }
};

// Helper function to update order total
async function updateOrderTotal(pesananId) {
  const orderItems = await prisma.oRDER_ITEM.findMany({
    where: { pesananId }
  });

  const jumlahTotal = orderItems.reduce((total, item) => total + item.totalHarga, 0);

  const order = await prisma.oRDER.findUnique({
    where: { pesananId },
    include: { restoran: true }
  });

  const biayaOngkir = order.restoran?.biayaAntar || 0;
  const biayaLayanan = jumlahTotal * 0.05; // 5% service fee
  const totalBiaya = jumlahTotal + biayaOngkir + biayaLayanan;

  await prisma.oRDER.update({
    where: { pesananId },
    data: {
      jumlahTotal,
      biayaLayanan,
      totalBiaya,
      updatedAt: new Date()
    }
  });
} 