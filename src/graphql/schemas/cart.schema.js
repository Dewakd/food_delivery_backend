export const typeDefs = `#graphql
  # Cart Types
  type Cart {
    cartId: ID!
    penggunaId: ID!
    restoranId: ID!
    alamatAntar: String
    metodePembayaran: String
    catatanPesanan: String
    createdAt: String!
    updatedAt: String!
    
    # Relations
    pengguna: User!
    restoran: Restaurant!
    items: [CartItem!]!
    
    # Computed fields
    itemCount: Int!
    subtotal: Float!
    deliveryFee: Float!
    serviceFee: Float!
    totalAmount: Float!
  }

  type CartItem {
    cartItemId: ID!
    cartId: ID!
    itemMenuId: ID!
    quantity: Int!
    instruksiKhusus: String
    createdAt: String!
    updatedAt: String!
    
    # Relations
    cart: Cart!
    menuItem: MenuItem!
    
    # Computed fields
    unitPrice: Float!
    totalPrice: Float!
  }

  # Input Types
  input CreateCartInput {
    restoranId: ID!
    alamatAntar: String
    metodePembayaran: String
    catatanPesanan: String
  }

  input AddToCartInput {
    restoranId: ID!
    itemMenuId: ID!
    quantity: Int!
    instruksiKhusus: String
  }

  input UpdateCartItemInput {
    quantity: Int
    instruksiKhusus: String
  }

  input UpdateCartInput {
    alamatAntar: String
    metodePembayaran: String
    catatanPesanan: String
  }

  # Cart Queries
  extend type Query {
    # Get user's cart for specific restaurant
    getMyCart(restoranId: ID): Cart
    
    # Get all user's carts (if they have multiple restaurants)
    getMyCarts: [Cart!]!
    
    # Get cart by ID
    getCartById(id: ID!): Cart
  }

  # Cart Mutations
  extend type Mutation {
    # Cart management
    createOrGetCart(input: CreateCartInput!): Cart!
    updateCart(cartId: ID!, input: UpdateCartInput!): Cart!
    clearCart(cartId: ID!): Boolean!
    
    # Cart item management
    addToCart(input: AddToCartInput!): CartItem!
    updateCartItem(cartItemId: ID!, input: UpdateCartItemInput!): CartItem!
    removeFromCart(cartItemId: ID!): Boolean!
    
    # Checkout (convert cart to order)
    checkoutCart(cartId: ID!): Order!
    
    # Restaurant switching
    switchRestaurant(newRestoranId: ID!, alamatAntar: String): Cart!
  }
`; 