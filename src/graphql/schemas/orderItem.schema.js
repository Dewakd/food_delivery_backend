
export const typeDefs = `#graphql
  # Tipe data untuk Order Item
  type OrderItem {
    itemPesananId: ID!
    quantity: Int!
    instruksiKhusus: String
    hargaSatuan: Float!
    totalHarga: Float!
    createdAt: String
    updatedAt: String
    # Relasi
    pesanan: Order
    menuItem: MenuItem
  }

  # Input types untuk mutations
  input CreateOrderItemInput {
    pesananId: ID!
    itemMenuId: ID!
    quantity: Int!
    instruksiKhusus: String
  }

  input UpdateOrderItemInput {
    quantity: Int
    instruksiKhusus: String
  }

  # Filter untuk order items
  input OrderItemFilter {
    pesananId: ID
    itemMenuId: ID
    minQuantity: Int
    maxQuantity: Int
  }

  # Order item statistics
  type OrderItemStats {
    totalQuantity: Int!
    totalValue: Float!
    popularItems: [MenuItem]
    averageQuantityPerOrder: Float!
  }

  # Menambahkan queries ke dalam Query
  extend type Query {
    getOrderItemById(id: ID!): OrderItem
    getOrderItemsByOrder(orderId: ID!): [OrderItem]
    getOrderItemsByMenuItem(menuItemId: ID!, limit: Int): [OrderItem]
    getPopularOrderItems(restoranId: ID, limit: Int): [OrderItem]
    getOrderItemStats(restoranId: ID, dateFrom: String, dateTo: String): OrderItemStats
  }

  # Menambahkan mutations ke dalam Mutation
  extend type Mutation {
    # Order item management
    addItemToOrder(input: CreateOrderItemInput!): OrderItem
    updateOrderItem(id: ID!, input: UpdateOrderItemInput!): OrderItem
    removeItemFromOrder(id: ID!): Boolean
    
    # Bulk operations
    addMultipleItemsToOrder(pesananId: ID!, items: [OrderItemInput!]!): [OrderItem]
    removeMultipleItemsFromOrder(itemIds: [ID!]!): Boolean
    updateOrderItemQuantities(updates: [OrderItemQuantityUpdate!]!): [OrderItem]
  }

  # Input untuk bulk quantity updates
  input OrderItemQuantityUpdate {
    itemPesananId: ID!
    quantity: Int!
  }
`; 