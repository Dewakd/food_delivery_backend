    export const typeDefs = `#graphql
  # Mendefinisikan tipe data untuk Restaurant
  type Restaurant {
    restoranId: ID!
    nama: String!
    alamat: String!
    jenisMasakan: String
    rating: Float
    jamBuka: String
    biayaAntar: Float
    isActive: Boolean!
    urlGambar: String
    telepon: String
    deskripsi: String
    createdAt: String
    updatedAt: String
    # Relasi
    owner: User
    menuItems: [MenuItem]
    orders: [Order]
    totalOrders: Int
    averageRating: Float
  }
  
  # Mendefinisikan tipe data untuk Menu Item
  type MenuItem {
    itemMenuId: ID!
    nama: String!
    deskripsi: String
    harga: Float!
    urlGambar: String
    isAvailable: Boolean!
    kategori: String
    createdAt: String
    updatedAt: String
    # Relasi
    restoran: Restaurant
    orderItems: [OrderItem]
  }

  # Input types untuk mutations
  input CreateRestaurantInput {
    nama: String!
    alamat: String!
    jenisMasakan: String
    jamBuka: String
    biayaAntar: Float
    telepon: String
    deskripsi: String
    urlGambar: String
  }

  input UpdateRestaurantInput {
    nama: String
    alamat: String
    jenisMasakan: String
    jamBuka: String
    biayaAntar: Float
    telepon: String
    deskripsi: String
    urlGambar: String
    isActive: Boolean
  }

  input CreateMenuItemInput {
    nama: String!
    deskripsi: String
    harga: Float!
    kategori: String
    urlGambar: String
    restoranId: ID!
  }

  input UpdateMenuItemInput {
    nama: String
    deskripsi: String
    harga: Float
    kategori: String
    urlGambar: String
    isAvailable: Boolean
  }

  # Filter dan sorting
  input RestaurantFilter {
    jenisMasakan: String
    minRating: Float
    maxBiayaAntar: Float
    isActive: Boolean
  }

  enum RestaurantSortBy {
    NAME_ASC
    NAME_DESC
    RATING_ASC
    RATING_DESC
    DELIVERY_FEE_ASC
    DELIVERY_FEE_DESC
    CREATED_AT_ASC
    CREATED_AT_DESC
  }

  # Menambahkan pertanyaan baru ke dalam Query
  extend type Query {
    getAllRestaurants(filter: RestaurantFilter, sortBy: RestaurantSortBy, limit: Int, offset: Int): [Restaurant]
    getRestaurantById(id: ID!): Restaurant
    getMyRestaurant: Restaurant
    getMyRestaurants: [Restaurant]
    searchRestaurants(searchTerm: String!, limit: Int): [Restaurant]
    getRestaurantsByType(jenisMasakan: String!): [Restaurant]
    getPopularRestaurants(limit: Int): [Restaurant]
    
    # Menu Item queries
    getMenuItemById(id: ID!): MenuItem
    getMenuItemsByRestaurant(restoranId: ID!): [MenuItem]
    getMenuItemsByCategory(restoranId: ID!, kategori: String!): [MenuItem]
    searchMenuItems(restoranId: ID!, searchTerm: String!): [MenuItem]
  }

  # Menambahkan aksi baru ke dalam Mutation
  extend type Mutation {
    # Restaurant mutations
    createRestaurant(input: CreateRestaurantInput!): Restaurant
    updateRestaurant(id: ID!, input: UpdateRestaurantInput!): Restaurant
    deleteRestaurant(id: ID!): Boolean
    toggleRestaurantStatus(id: ID!): Restaurant
    
    # Menu Item mutations
    createMenuItem(input: CreateMenuItemInput!): MenuItem
    updateMenuItem(id: ID!, input: UpdateMenuItemInput!): MenuItem
    deleteMenuItem(id: ID!): Boolean
    toggleMenuItemAvailability(id: ID!): MenuItem
    

  }
`;
    