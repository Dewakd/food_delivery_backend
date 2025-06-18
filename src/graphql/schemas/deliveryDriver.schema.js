// File: src/graphql/schemas/deliveryDriver.schema.js

export const typeDefs = `#graphql
  # Enum untuk status driver
  enum DriverStatus {
    Online
    Offline
    Delivering
  }

  # Tipe data untuk Delivery Driver
  type DeliveryDriver {
    pengemudiId: ID!
    namaPengemudi: String!
    telepon: String
    detailKendaraan: String
    status: DriverStatus
    lokasiSaatIni: String
    rating: Float
    totalDeliveries: Int
    isActive: Boolean!
    createdAt: String
    updatedAt: String
    # Relasi
    orders: [Order]
    activeOrder: Order
    deliveryHistory: [Order]
  }

  # Input types untuk mutations
  input CreateDriverInput {
    namaPengemudi: String!
    telepon: String
    detailKendaraan: String
    lokasiSaatIni: String
  }

  input UpdateDriverInput {
    namaPengemudi: String
    telepon: String
    detailKendaraan: String
    lokasiSaatIni: String
  }

  input UpdateDriverLocationInput {
    lokasiSaatIni: String!
  }

  # Filter dan sorting untuk drivers
  input DriverFilter {
    status: DriverStatus
    isActive: Boolean
    minRating: Float
  }

  enum DriverSortBy {
    NAME_ASC
    NAME_DESC
    RATING_ASC
    RATING_DESC
    TOTAL_DELIVERIES_ASC
    TOTAL_DELIVERIES_DESC
    CREATED_AT_ASC
    CREATED_AT_DESC
  }



  # Menambahkan queries ke dalam Query
  extend type Query {
    getAllDrivers(filter: DriverFilter, sortBy: DriverSortBy, limit: Int, offset: Int): [DeliveryDriver]
    getDriverById(id: ID!): DeliveryDriver
    getMyDriverProfile: DeliveryDriver
    getAvailableOrders(limit: Int): [Order]
    getMyActiveDelivery: Order
    getMyDeliveryHistory(limit: Int, offset: Int): [Order]
  }

  # Menambahkan mutations ke dalam Mutation
  extend type Mutation {
    # Driver profile management
    createDriverProfile(input: CreateDriverInput!): DeliveryDriver
    updateDriverProfile(input: UpdateDriverInput!): DeliveryDriver
    deleteDriverProfile: Boolean
    
    # Driver order management
    acceptOrder(orderId: ID!): Order
    
    # Driver status management
    updateDriverStatus(status: DriverStatus!): DeliveryDriver
    goOnline: DeliveryDriver
    goOffline: DeliveryDriver
    startDelivery(orderId: ID!): DeliveryDriver
    completeDelivery(orderId: ID!): DeliveryDriver
    
    # Location management
    updateDriverLocation(input: UpdateDriverLocationInput!): DeliveryDriver
  }
`; 