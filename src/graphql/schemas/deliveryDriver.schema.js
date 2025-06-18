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
    completedOrders: [Order]
    earnings: Float
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

  # Driver performance stats
  type DriverStats {
    totalDeliveries: Int!
    totalEarnings: Float!
    averageRating: Float!
    completionRate: Float!
    onlineHours: Float!
  }

  # Menambahkan queries ke dalam Query
  extend type Query {
    getAllDrivers(filter: DriverFilter, sortBy: DriverSortBy, limit: Int, offset: Int): [DeliveryDriver]
    getDriverById(id: ID!): DeliveryDriver
    getMyDriverProfile: DeliveryDriver
    getAvailableDrivers(limit: Int): [DeliveryDriver]
    getDriversByStatus(status: DriverStatus!): [DeliveryDriver]
    searchDrivers(searchTerm: String!, limit: Int): [DeliveryDriver]
    getDriverStats(driverId: ID!): DriverStats
    getNearbyDrivers(latitude: Float!, longitude: Float!, radius: Float!): [DeliveryDriver]
  }

  # Menambahkan mutations ke dalam Mutation
  extend type Mutation {
    # Driver profile management
    createDriverProfile(input: CreateDriverInput!): DeliveryDriver
    updateDriverProfile(input: UpdateDriverInput!): DeliveryDriver
    deleteDriverProfile: Boolean
    
    # Driver status management
    updateDriverStatus(status: DriverStatus!): DeliveryDriver
    goOnline: DeliveryDriver
    goOffline: DeliveryDriver
    startDelivery(orderId: ID!): DeliveryDriver
    completeDelivery(orderId: ID!): DeliveryDriver
    
    # Location management
    updateDriverLocation(input: UpdateDriverLocationInput!): DeliveryDriver
    
    # Admin operations (Restaurant role only)
    toggleDriverActiveStatus(driverId: ID!): DeliveryDriver
    assignOrderToDriver(orderId: ID!, driverId: ID!): DeliveryDriver
    removeDriverFromOrder(orderId: ID!): Boolean
    
    # Bulk operations
    bulkUpdateDriverStatus(driverIds: [ID!]!, status: DriverStatus!): [DeliveryDriver]
  }
`; 