import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    getMyCart: async (_, { restoranId }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const where = {
        penggunaId: user.penggunaId,
        ...(restoranId && { restoranId: parseInt(restoranId) })
      };

      return await prisma.cART.findFirst({
        where,
        orderBy: { updatedAt: 'desc' }
      });
    },

    getMyCarts: async (_, __, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      return await prisma.cART.findMany({
        where: { penggunaId: user.penggunaId },
        orderBy: { updatedAt: 'desc' }
      });
    },

    getCartById: async (_, { id }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const cart = await prisma.cART.findUnique({
        where: { cartId: parseInt(id) }
      });

      if (!cart) {
        throw new GraphQLError('Cart not found', {
          extensions: { code: 'CART_NOT_FOUND' }
        });
      }

      if (cart.penggunaId !== user.penggunaId) {
        throw new GraphQLError('You can only access your own cart', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return cart;
    }
  },

  Mutation: {
    createOrGetCart: async (_, { input }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Check if user has carts for other restaurants
      const otherRestaurantCarts = await prisma.cART.findMany({
        where: { 
          penggunaId: user.penggunaId,
          restoranId: { not: parseInt(input.restoranId) }
        }
      });

      // Clear all existing carts from other restaurants
      if (otherRestaurantCarts.length > 0) {
        for (const cart of otherRestaurantCarts) {
          await prisma.cART_ITEM.deleteMany({
            where: { cartId: cart.cartId }
          });
          await prisma.cART.delete({
            where: { cartId: cart.cartId }
          });
        }
      }

      // Check if cart already exists for this user and restaurant
      const existingCart = await prisma.cART.findUnique({
        where: {
          penggunaId_restoranId: {
            penggunaId: user.penggunaId,
            restoranId: parseInt(input.restoranId)
          }
        }
      });

      if (existingCart) {
        // Update existing cart if needed
        if (input.alamatAntar || input.metodePembayaran || input.catatanPesanan) {
          return await prisma.cART.update({
            where: { cartId: existingCart.cartId },
            data: {
              alamatAntar: input.alamatAntar || existingCart.alamatAntar,
              metodePembayaran: input.metodePembayaran || existingCart.metodePembayaran,
              catatanPesanan: input.catatanPesanan || existingCart.catatanPesanan,
              updatedAt: new Date()
            }
          });
        }
        return existingCart;
      }

      // Create new cart
      return await prisma.cART.create({
        data: {
          penggunaId: user.penggunaId,
          restoranId: parseInt(input.restoranId),
          alamatAntar: input.alamatAntar,
          metodePembayaran: input.metodePembayaran,
          catatanPesanan: input.catatanPesanan
        }
      });
    },

    addToCart: async (_, { input }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Check if user has carts for other restaurants
      const existingCarts = await prisma.cART.findMany({
        where: { 
          penggunaId: user.penggunaId,
          restoranId: { not: parseInt(input.restoranId) }
        }
      });

      // Clear all existing carts from other restaurants
      if (existingCarts.length > 0) {
        for (const existingCart of existingCarts) {
          await prisma.cART_ITEM.deleteMany({
            where: { cartId: existingCart.cartId }
          });
          await prisma.cART.delete({
            where: { cartId: existingCart.cartId }
          });
        }
      }

      // Get or create cart for current restaurant
      let cart = await prisma.cART.findUnique({
        where: {
          penggunaId_restoranId: {
            penggunaId: user.penggunaId,
            restoranId: parseInt(input.restoranId)
          }
        }
      });

      if (!cart) {
        cart = await prisma.cART.create({
          data: {
            penggunaId: user.penggunaId,
            restoranId: parseInt(input.restoranId)
          }
        });
      }

      // Check if menu item exists and is available
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

      if (menuItem.restoranId !== parseInt(input.restoranId)) {
        throw new GraphQLError('Menu item does not belong to this restaurant', {
          extensions: { code: 'MENU_ITEM_MISMATCH' }
        });
      }

      // Check if item already exists in cart
      const existingCartItem = await prisma.cART_ITEM.findUnique({
        where: {
          cartId_itemMenuId: {
            cartId: cart.cartId,
            itemMenuId: parseInt(input.itemMenuId)
          }
        }
      });

      if (existingCartItem) {
        // Update quantity
        return await prisma.cART_ITEM.update({
          where: { cartItemId: existingCartItem.cartItemId },
          data: {
            quantity: existingCartItem.quantity + input.quantity,
            instruksiKhusus: input.instruksiKhusus || existingCartItem.instruksiKhusus,
            updatedAt: new Date()
          }
        });
      }

      // Create new cart item
      return await prisma.cART_ITEM.create({
        data: {
          cartId: cart.cartId,
          itemMenuId: parseInt(input.itemMenuId),
          quantity: input.quantity,
          instruksiKhusus: input.instruksiKhusus
        }
      });
    },

    updateCartItem: async (_, { cartItemId, input }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const cartItem = await prisma.cART_ITEM.findUnique({
        where: { cartItemId: parseInt(cartItemId) },
        include: { cart: true }
      });

      if (!cartItem) {
        throw new GraphQLError('Cart item not found', {
          extensions: { code: 'CART_ITEM_NOT_FOUND' }
        });
      }

      if (cartItem.cart.penggunaId !== user.penggunaId) {
        throw new GraphQLError('You can only modify your own cart items', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      if (input.quantity && input.quantity <= 0) {
        throw new GraphQLError('Quantity must be greater than 0', {
          extensions: { code: 'INVALID_QUANTITY' }
        });
      }

      const updateData = {};
      if (input.quantity) updateData.quantity = input.quantity;
      if (input.instruksiKhusus !== undefined) updateData.instruksiKhusus = input.instruksiKhusus;
      updateData.updatedAt = new Date();

      return await prisma.cART_ITEM.update({
        where: { cartItemId: parseInt(cartItemId) },
        data: updateData
      });
    },

    removeFromCart: async (_, { cartItemId }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const cartItem = await prisma.cART_ITEM.findUnique({
        where: { cartItemId: parseInt(cartItemId) },
        include: { cart: true }
      });

      if (!cartItem) {
        throw new GraphQLError('Cart item not found', {
          extensions: { code: 'CART_ITEM_NOT_FOUND' }
        });
      }

      if (cartItem.cart.penggunaId !== user.penggunaId) {
        throw new GraphQLError('You can only modify your own cart items', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      await prisma.cART_ITEM.delete({
        where: { cartItemId: parseInt(cartItemId) }
      });

      return true;
    },

    clearCart: async (_, { cartId }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const cart = await prisma.cART.findUnique({
        where: { cartId: parseInt(cartId) }
      });

      if (!cart) {
        throw new GraphQLError('Cart not found', {
          extensions: { code: 'CART_NOT_FOUND' }
        });
      }

      if (cart.penggunaId !== user.penggunaId) {
        throw new GraphQLError('You can only clear your own cart', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      // Delete all cart items first
      await prisma.cART_ITEM.deleteMany({
        where: { cartId: parseInt(cartId) }
      });

      // Delete the cart
      await prisma.cART.delete({
        where: { cartId: parseInt(cartId) }
      });

      return true;
    },

    updateCart: async (_, { cartId, input }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const cart = await prisma.cART.findUnique({
        where: { cartId: parseInt(cartId) }
      });

      if (!cart) {
        throw new GraphQLError('Cart not found', {
          extensions: { code: 'CART_NOT_FOUND' }
        });
      }

      if (cart.penggunaId !== user.penggunaId) {
        throw new GraphQLError('You can only update your own cart', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const updateData = {};
      if (input.alamatAntar !== undefined) updateData.alamatAntar = input.alamatAntar;
      if (input.metodePembayaran !== undefined) updateData.metodePembayaran = input.metodePembayaran;
      if (input.catatanPesanan !== undefined) updateData.catatanPesanan = input.catatanPesanan;
      updateData.updatedAt = new Date();

      return await prisma.cART.update({
        where: { cartId: parseInt(cartId) },
        data: updateData
      });
    },

    checkoutCart: async (_, { cartId }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const cart = await prisma.cART.findUnique({
        where: { cartId: parseInt(cartId) },
        include: {
          items: {
            include: { menuItem: true }
          },
          restoran: true
        }
      });

      if (!cart) {
        throw new GraphQLError('Cart not found', {
          extensions: { code: 'CART_NOT_FOUND' }
        });
      }

      if (cart.penggunaId !== user.penggunaId) {
        throw new GraphQLError('You can only checkout your own cart', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      if (!cart.items || cart.items.length === 0) {
        throw new GraphQLError('Cannot checkout empty cart', {
          extensions: { code: 'EMPTY_CART' }
        });
      }

      if (!cart.alamatAntar) {
        throw new GraphQLError('Delivery address is required for checkout', {
          extensions: { code: 'MISSING_ADDRESS' }
        });
      }

      // Calculate totals
      let jumlahTotal = 0;
      const orderItems = [];

      for (const cartItem of cart.items) {
        if (!cartItem.menuItem.isAvailable) {
          throw new GraphQLError(`Menu item ${cartItem.menuItem.nama} is no longer available`, {
            extensions: { code: 'MENU_ITEM_UNAVAILABLE' }
          });
        }

        const itemTotal = cartItem.menuItem.harga * cartItem.quantity;
        jumlahTotal += itemTotal;

        orderItems.push({
          itemMenuId: cartItem.itemMenuId,
          quantity: cartItem.quantity,
          instruksiKhusus: cartItem.instruksiKhusus,
          hargaSatuan: cartItem.menuItem.harga,
          totalHarga: itemTotal
        });
      }

      const biayaOngkir = cart.restoran.biayaAntar || 0;
      const biayaLayanan = jumlahTotal * 0.05; // 5% service fee
      const totalBiaya = jumlahTotal + biayaOngkir + biayaLayanan;

      // Create order
      const order = await prisma.oRDER.create({
        data: {
          penggunaId: user.penggunaId,
          restoranId: cart.restoranId,
          alamatAntar: cart.alamatAntar,
          metodePembayaran: cart.metodePembayaran || 'cash',
          catatanPesanan: cart.catatanPesanan,
          jumlahTotal,
          biayaOngkir,
          biayaLayanan,
          totalBiaya,
          status: 'pending',
          items: {
            create: orderItems
          }
        }
      });

      // Clear cart after successful checkout
      await prisma.cART_ITEM.deleteMany({
        where: { cartId: parseInt(cartId) }
      });

      await prisma.cART.delete({
        where: { cartId: parseInt(cartId) }
      });

      return order;
    },

    switchRestaurant: async (_, { newRestoranId, alamatAntar }, { user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Get current carts
      const existingCarts = await prisma.cART.findMany({
        where: { penggunaId: user.penggunaId }
      });

      // Clear all existing carts (restaurant switching)
      for (const cart of existingCarts) {
        await prisma.cART_ITEM.deleteMany({
          where: { cartId: cart.cartId }
        });
        await prisma.cART.delete({
          where: { cartId: cart.cartId }
        });
      }

      // Create new cart for new restaurant
      return await prisma.cART.create({
        data: {
          penggunaId: user.penggunaId,
          restoranId: parseInt(newRestoranId),
          alamatAntar
        }
      });
    }
  },

  // Resolvers for nested fields
  Cart: {
    pengguna: async (parent) => {
      return await prisma.uSER.findUnique({
        where: { penggunaId: parent.penggunaId }
      });
    },

    restoran: async (parent) => {
      return await prisma.rESTAURANT.findUnique({
        where: { restoranId: parent.restoranId }
      });
    },

    items: async (parent) => {
      return await prisma.cART_ITEM.findMany({
        where: { cartId: parent.cartId },
        orderBy: { createdAt: 'asc' }
      });
    },

    itemCount: async (parent) => {
      const items = await prisma.cART_ITEM.findMany({
        where: { cartId: parent.cartId }
      });
      return items.reduce((total, item) => total + item.quantity, 0);
    },

    subtotal: async (parent) => {
      const items = await prisma.cART_ITEM.findMany({
        where: { cartId: parent.cartId },
        include: { menuItem: true }
      });
      return items.reduce((total, item) => total + (item.menuItem.harga * item.quantity), 0);
    },

    deliveryFee: async (parent) => {
      const restaurant = await prisma.rESTAURANT.findUnique({
        where: { restoranId: parent.restoranId }
      });
      return restaurant?.biayaAntar || 0;
    },

    serviceFee: async (parent) => {
      const items = await prisma.cART_ITEM.findMany({
        where: { cartId: parent.cartId },
        include: { menuItem: true }
      });
      const subtotal = items.reduce((total, item) => total + (item.menuItem.harga * item.quantity), 0);
      return subtotal * 0.05; // 5% service fee
    },

    totalAmount: async (parent) => {
      const items = await prisma.cART_ITEM.findMany({
        where: { cartId: parent.cartId },
        include: { menuItem: true }
      });
      const subtotal = items.reduce((total, item) => total + (item.menuItem.harga * item.quantity), 0);
      
      const restaurant = await prisma.rESTAURANT.findUnique({
        where: { restoranId: parent.restoranId }
      });
      const deliveryFee = restaurant?.biayaAntar || 0;
      const serviceFee = subtotal * 0.05;
      
      return subtotal + deliveryFee + serviceFee;
    }
  },

  CartItem: {
    cart: async (parent) => {
      return await prisma.cART.findUnique({
        where: { cartId: parent.cartId }
      });
    },

    menuItem: async (parent) => {
      return await prisma.mENU_ITEM.findUnique({
        where: { itemMenuId: parent.itemMenuId }
      });
    },

    unitPrice: async (parent) => {
      const menuItem = await prisma.mENU_ITEM.findUnique({
        where: { itemMenuId: parent.itemMenuId }
      });
      return menuItem?.harga || 0;
    },

    totalPrice: async (parent) => {
      const menuItem = await prisma.mENU_ITEM.findUnique({
        where: { itemMenuId: parent.itemMenuId }
      });
      return (menuItem?.harga || 0) * parent.quantity;
    }
  }
}; 