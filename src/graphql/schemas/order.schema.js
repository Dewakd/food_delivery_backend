// File: src/graphql/schemas/order.schema.js

export const typeDefs = `#graphql
  # Enum untuk status pesanan
  enum OrderStatus {
    pending
    confirmed
    preparing
    ready
    delivering
    completed
    cancelled
  }

  # Enum untuk metode pembayaran
  enum PaymentMethod {
    cash
    credit_card
    debit_card
    e_wallet
    bank_transfer
  }

  # Tipe data untuk Order
  type Order {
    pesananId: ID!
    tanggalPesanan: String
    jumlahTotal: Float!
    status: OrderStatus
    alamatAntar: String!
    metodePembayaran: PaymentMethod
    catatanPesanan: String
    estimasiWaktu: String
    biayaOngkir: Float
    biayaLayanan: Float
    totalBiaya: Float
    createdAt: String
    updatedAt: String
    # Relasi
    pengguna: User
    restoran: Restaurant
    pengemudi: DeliveryDriver
    items: [OrderItem]
    totalItems: Int
  }

  # Input types untuk mutations
  input CreateOrderInput {
    restoranId: ID!
    alamatAntar: String!
    metodePembayaran: PaymentMethod!
    catatanPesanan: String
    items: [OrderItemInput!]!
  }

  input OrderItemInput {
    itemMenuId: ID!
    quantity: Int!
    instruksiKhusus: String
  }

  input UpdateOrderInput {
    status: OrderStatus
    estimasiWaktu: String
    catatanPesanan: String
  }

  input UpdateOrderStatusInput {
    orderId: ID!
    status: OrderStatus!
    estimasiWaktu: String
  }

  # Filter dan sorting untuk orders
  input OrderFilter {
    status: OrderStatus
    restoranId: ID
    penggunaId: ID
    pengemudiId: ID
    metodePembayaran: PaymentMethod
    dateFrom: String
    dateTo: String
    minTotal: Float
    maxTotal: Float
  }

  enum OrderSortBy {
    DATE_ASC
    DATE_DESC
    TOTAL_ASC
    TOTAL_DESC
    STATUS_ASC
    STATUS_DESC
    CREATED_AT_ASC
    CREATED_AT_DESC
  }



  # Menambahkan queries ke dalam Query
  extend type Query {
    getAllOrders(filter: OrderFilter, sortBy: OrderSortBy, limit: Int, offset: Int): [Order]
    getOrderById(id: ID!): Order
    getMyOrders(limit: Int, offset: Int): [Order]
    getOrdersByRestaurant(restoranId: ID!, filter: OrderFilter, limit: Int): [Order]
    getOrdersByDriver(driverId: ID!, filter: OrderFilter, limit: Int): [Order]
    getActiveOrders: [Order]
    getPendingOrders: [Order]
    getOrderHistory(limit: Int, offset: Int): [Order]
    searchOrders(searchTerm: String!, limit: Int): [Order]
  }

  # Menambahkan mutations ke dalam Mutation
  extend type Mutation {
    # Customer operations
    createOrder(input: CreateOrderInput!): Order
    cancelOrder(orderId: ID!, reason: String): Order
    
    # Restaurant operations  
    confirmOrder(orderId: ID!, estimasiWaktu: String): Order
    updateOrderStatus(input: UpdateOrderStatusInput!): Order
    rejectOrder(orderId: ID!, reason: String!): Order
    
    # Driver operations
    acceptDelivery(orderId: ID!): Order
    startDelivery(orderId: ID!): Order
    completeDelivery(orderId: ID!): Order
    

  }
`; 