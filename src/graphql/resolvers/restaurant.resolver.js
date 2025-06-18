    // File: src/graphql/resolvers/restaurant.resolver.js

import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    getAllRestaurants: async (_, { filter, sortBy, limit = 50, offset = 0 }) => {
      // Build where clause for filtering
      const where = {
        ...(filter?.jenisMasakan && { jenisMasakan: filter.jenisMasakan }),
        ...(filter?.minRating && { rating: { gte: filter.minRating } }),
        ...(filter?.maxBiayaAntar && { biayaAntar: { lte: filter.maxBiayaAntar } }),
        ...(filter?.isActive !== undefined && { isActive: filter.isActive })
      };

      // Build orderBy clause for sorting
      let orderBy = {};
      switch (sortBy) {
        case 'NAME_ASC':
          orderBy = { nama: 'asc' };
          break;
        case 'NAME_DESC':
          orderBy = { nama: 'desc' };
          break;
        case 'RATING_ASC':
          orderBy = { rating: 'asc' };
          break;
        case 'RATING_DESC':
          orderBy = { rating: 'desc' };
          break;
        case 'DELIVERY_FEE_ASC':
          orderBy = { biayaAntar: 'asc' };
          break;
        case 'DELIVERY_FEE_DESC':
          orderBy = { biayaAntar: 'desc' };
          break;
        case 'CREATED_AT_ASC':
          orderBy = { createdAt: 'asc' };
          break;
        case 'CREATED_AT_DESC':
        default:
          orderBy = { createdAt: 'desc' };
          break;
      }

      return await prisma.rESTAURANT.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      });
    },

    getRestaurantById: async (_, { id }) => {
      const restaurant = await prisma.rESTAURANT.findUnique({
        where: { restoranId: parseInt(id) },
      });

      if (!restaurant) {
        throw new GraphQLError('Restaurant not found', {
          extensions: { code: 'RESTAURANT_NOT_FOUND' }
        });
      }

      return restaurant;
    },

    getMyRestaurant: async (_, __, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can access this', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      // For now, we'll find restaurant by user ID logic (you might need to add ownerId field to Restaurant model)
      // This is a simplified version - in real app, you'd have restaurant ownership tracking
      const restaurants = await prisma.rESTAURANT.findMany({
        where: { isActive: true }
      });

      // Return first restaurant for now (in real app, you'd have proper ownership)
      return restaurants[0] || null;
    },

    searchRestaurants: async (_, { searchTerm, limit = 20 }) => {
      return await prisma.rESTAURANT.findMany({
        where: {
          OR: [
            { nama: { contains: searchTerm } },
            { jenisMasakan: { contains: searchTerm } },
            { alamat: { contains: searchTerm } },
            { deskripsi: { contains: searchTerm } }
          ],
          isActive: true
        },
        take: limit,
        orderBy: { rating: 'desc' }
      });
    },

    getRestaurantsByType: async (_, { jenisMasakan }) => {
      return await prisma.rESTAURANT.findMany({
        where: {
          jenisMasakan,
          isActive: true
        },
        orderBy: { rating: 'desc' }
      });
    },

    getPopularRestaurants: async (_, { limit = 10 }) => {
      return await prisma.rESTAURANT.findMany({
        where: { isActive: true },
        orderBy: [
          { rating: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      });
    },

    // Menu Item queries
    getMenuItemById: async (_, { id }) => {
      const menuItem = await prisma.mENU_ITEM.findUnique({
        where: { itemMenuId: parseInt(id) },
      });

      if (!menuItem) {
        throw new GraphQLError('Menu item not found', {
          extensions: { code: 'MENU_ITEM_NOT_FOUND' }
        });
      }

      return menuItem;
    },

    getMenuItemsByRestaurant: async (_, { restoranId }) => {
      return await prisma.mENU_ITEM.findMany({
        where: {
          restoranId: parseInt(restoranId),
          isAvailable: true
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    getMenuItemsByCategory: async (_, { restoranId, kategori }) => {
      return await prisma.mENU_ITEM.findMany({
        where: {
          restoranId: parseInt(restoranId),
          kategori,
          isAvailable: true
        },
        orderBy: { nama: 'asc' }
      });
    },

    searchMenuItems: async (_, { restoranId, searchTerm }) => {
      return await prisma.mENU_ITEM.findMany({
        where: {
          restoranId: parseInt(restoranId),
          OR: [
            { nama: { contains: searchTerm } },
            { deskripsi: { contains: searchTerm } },
            { kategori: { contains: searchTerm } }
          ],
          isAvailable: true
        },
        orderBy: { nama: 'asc' }
      });
    },
  },

  Mutation: {
    // Restaurant mutations
    createRestaurant: async (_, { input }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can create restaurants', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return await prisma.rESTAURANT.create({
        data: {
          ...input,
          biayaAntar: input.biayaAntar || 0,
          rating: 0,
          isActive: true
        },
      });
    },

    updateRestaurant: async (_, { id, input }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can update restaurants', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const restaurantId = parseInt(id);

      // Check if restaurant exists
      const restaurant = await prisma.rESTAURANT.findUnique({
        where: { restoranId: restaurantId }
      });

      if (!restaurant) {
        throw new GraphQLError('Restaurant not found', {
          extensions: { code: 'RESTAURANT_NOT_FOUND' }
        });
      }

      return await prisma.rESTAURANT.update({
        where: { restoranId: restaurantId },
        data: {
          ...input,
          updatedAt: new Date()
        }
      });
    },

    deleteRestaurant: async (_, { id }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can delete restaurants', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const restaurantId = parseInt(id);

      // Check if restaurant exists
      const restaurant = await prisma.rESTAURANT.findUnique({
        where: { restoranId: restaurantId }
      });

      if (!restaurant) {
        throw new GraphQLError('Restaurant not found', {
          extensions: { code: 'RESTAURANT_NOT_FOUND' }
        });
      }

      await prisma.rESTAURANT.delete({
        where: { restoranId: restaurantId }
      });

      return true;
    },

    toggleRestaurantStatus: async (_, { id }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can toggle status', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const restaurantId = parseInt(id);

      const restaurant = await prisma.rESTAURANT.findUnique({
        where: { restoranId: restaurantId }
      });

      if (!restaurant) {
        throw new GraphQLError('Restaurant not found', {
          extensions: { code: 'RESTAURANT_NOT_FOUND' }
        });
      }

      return await prisma.rESTAURANT.update({
        where: { restoranId: restaurantId },
        data: {
          isActive: !restaurant.isActive,
          updatedAt: new Date()
        }
      });
    },

    // Menu Item mutations
    createMenuItem: async (_, { input }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can create menu items', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      // Validate restaurant exists
      const restaurant = await prisma.rESTAURANT.findUnique({
        where: { restoranId: parseInt(input.restoranId) }
      });

      if (!restaurant) {
        throw new GraphQLError('Restaurant not found', {
          extensions: { code: 'RESTAURANT_NOT_FOUND' }
        });
      }

      return await prisma.mENU_ITEM.create({
        data: {
          ...input,
          restoranId: parseInt(input.restoranId),
          isAvailable: true
        }
      });
    },

    updateMenuItem: async (_, { id, input }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can update menu items', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const menuItemId = parseInt(id);

      // Check if menu item exists
      const menuItem = await prisma.mENU_ITEM.findUnique({
        where: { itemMenuId: menuItemId }
      });

      if (!menuItem) {
        throw new GraphQLError('Menu item not found', {
          extensions: { code: 'MENU_ITEM_NOT_FOUND' }
        });
      }

      return await prisma.mENU_ITEM.update({
        where: { itemMenuId: menuItemId },
        data: {
          ...input,
          updatedAt: new Date()
        }
      });
    },

    deleteMenuItem: async (_, { id }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can delete menu items', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const menuItemId = parseInt(id);

      // Check if menu item exists
      const menuItem = await prisma.mENU_ITEM.findUnique({
        where: { itemMenuId: menuItemId }
      });

      if (!menuItem) {
        throw new GraphQLError('Menu item not found', {
          extensions: { code: 'MENU_ITEM_NOT_FOUND' }
        });
      }

      await prisma.mENU_ITEM.delete({
        where: { itemMenuId: menuItemId }
      });

      return true;
    },

    toggleMenuItemAvailability: async (_, { id }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can toggle availability', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const menuItemId = parseInt(id);

      const menuItem = await prisma.mENU_ITEM.findUnique({
        where: { itemMenuId: menuItemId }
      });

      if (!menuItem) {
        throw new GraphQLError('Menu item not found', {
          extensions: { code: 'MENU_ITEM_NOT_FOUND' }
        });
      }

      return await prisma.mENU_ITEM.update({
        where: { itemMenuId: menuItemId },
        data: {
          isAvailable: !menuItem.isAvailable,
          updatedAt: new Date()
        }
      });
    },

    // Bulk operations
    bulkUpdateMenuItems: async (_, { restoranId, isAvailable }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can bulk update menu items', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      await prisma.mENU_ITEM.updateMany({
        where: { restoranId: parseInt(restoranId) },
        data: {
          isAvailable,
          updatedAt: new Date()
        }
      });

      // Return updated menu items
      return await prisma.mENU_ITEM.findMany({
        where: { restoranId: parseInt(restoranId) }
      });
    },

    bulkDeleteMenuItems: async (_, { itemIds }, { user }) => {
      if (!user || user.role !== 'Restaurant') {
        throw new GraphQLError('Only restaurant owners can bulk delete menu items', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const menuItemIds = itemIds.map(id => parseInt(id));

      await prisma.mENU_ITEM.deleteMany({
        where: {
          itemMenuId: { in: menuItemIds }
        }
      });

      return true;
    },
  },

  // Relation resolvers
  Restaurant: {
    menuItems: async (parent) => {
      return await prisma.mENU_ITEM.findMany({
        where: {
          restoranId: parent.restoranId,
          isAvailable: true
        },
        orderBy: { kategori: 'asc' }
      });
    },

    orders: async (parent) => {
      return await prisma.oRDER.findMany({
        where: { restoranId: parent.restoranId },
        orderBy: { tanggalPesanan: 'desc' }
      });
    },

    totalOrders: async (parent) => {
      return await prisma.oRDER.count({
        where: { restoranId: parent.restoranId }
      });
    },

    averageRating: async (parent) => {
      // This would need a proper rating system in the future
      // For now, return the stored rating
      return parent.rating;
    }
  },

  MenuItem: {
    restoran: async (parent) => {
      return await prisma.rESTAURANT.findUnique({
        where: { restoranId: parent.restoranId }
      });
    },

    orderItems: async (parent) => {
      return await prisma.oRDER_ITEM.findMany({
        where: { itemMenuId: parent.itemMenuId }
      });
    }
  }
};
    