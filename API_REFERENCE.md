# Food Delivery Backend - GraphQL API Reference

## Authentication Headers
For authenticated requests, include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 USER MANAGEMENT

### Queries

#### `getAllUsers`
**Description**: Get all users (Restaurant/Driver access only)
```graphql
query GetAllUsers {
  getAllUsers {
    penggunaId
    email
    namaPengguna
    telepon
    alamat
    role
    createdAt
    updatedAt
  }
}
```

#### `me`
**Description**: Get current user profile (requires authentication)
```graphql
query Me {
  me {
    penggunaId
    email
    namaPengguna
    telepon
    alamat
    role
    createdAt
    updatedAt
  }
}
```

#### `getUserById`
**Description**: Get user by ID
```graphql
query GetUserById($id: ID!) {
  getUserById(id: $id) {
    penggunaId
    email
    namaPengguna
    telepon
    alamat
    role
    createdAt
    updatedAt
  }
}
```

#### `getUsersByRole`
**Description**: Get users by role (Restaurant access only)
```graphql
query GetUsersByRole($role: Role!) {
  getUsersByRole(role: $role) {
    penggunaId
    email
    namaPengguna
    telepon
    alamat
    role
    createdAt
    updatedAt
  }
}
```

#### `searchUsers`
**Description**: Search users by name, email, or phone (Restaurant/Driver access)
```graphql
query SearchUsers($searchTerm: String!) {
  searchUsers(searchTerm: $searchTerm) {
    penggunaId
    email
    namaPengguna
    telepon
    alamat
    role
    createdAt
    updatedAt
  }
}
```

### Mutations

#### `registerUser`
**Description**: Register a new user
```graphql
mutation RegisterUser(
  $email: String!
  $namaPengguna: String
  $password: String!
  $role: Role!
  $telepon: String
  $alamat: String
) {
  registerUser(
    email: $email
    namaPengguna: $namaPengguna
    password: $password
    role: $role
    telepon: $telepon
    alamat: $alamat
  ) {
    token
    user {
      penggunaId
      email
      namaPengguna
      role
    }
  }
}
```

#### `loginUser`
**Description**: Login user
```graphql
mutation LoginUser($email: String!, $password: String!) {
  loginUser(email: $email, password: $password) {
    token
    user {
      penggunaId
      email
      namaPengguna
      role
    }
  }
}
```

#### `updateProfile`
**Description**: Update user profile (requires authentication)
```graphql
mutation UpdateProfile($input: UpdateProfileInput!) {
  updateProfile(input: $input) {
    penggunaId
    email
    namaPengguna
    telepon
    alamat
    updatedAt
  }
}
```

#### `changePassword`
**Description**: Change user password (requires authentication)
```graphql
mutation ChangePassword($input: ChangePasswordInput!) {
  changePassword(input: $input)
}
```

#### `deleteUser`
**Description**: Delete user account
```graphql
mutation DeleteUser($id: ID!) {
  deleteUser(id: $id)
}
```

#### `updateUserRole`
**Description**: Update user role (Restaurant access only)
```graphql
mutation UpdateUserRole($id: ID!, $role: Role!) {
  updateUserRole(id: $id, role: $role) {
    penggunaId
    email
    namaPengguna
    role
    updatedAt
  }
}
```

---

## 🏪 RESTAURANT MANAGEMENT

### Queries

#### `getAllRestaurants`
**Description**: Get all restaurants with filtering and sorting
```graphql
query GetAllRestaurants(
  $filter: RestaurantFilter
  $sortBy: RestaurantSortBy
  $limit: Int
  $offset: Int
) {
  getAllRestaurants(
    filter: $filter
    sortBy: $sortBy
    limit: $limit
    offset: $offset
  ) {
    restoranId
    nama
    alamat
    jenisMasakan
    rating
    jamBuka
    biayaAntar
    isActive
    urlGambar
    telepon
    deskripsi
    createdAt
    updatedAt
    totalOrders
    averageRating
  }
}
```

#### `getRestaurantById`
**Description**: Get restaurant by ID
```graphql
query GetRestaurantById($id: ID!) {
  getRestaurantById(id: $id) {
    restoranId
    nama
    alamat
    jenisMasakan
    rating
    jamBuka
    biayaAntar
    isActive
    urlGambar
    telepon
    deskripsi
    createdAt
    updatedAt
    menuItems {
      itemMenuId
      nama
      deskripsi
      harga
      kategori
      urlGambar
      isAvailable
    }
  }
}
```

#### `getMyRestaurant`
**Description**: Get current user's restaurant (Restaurant access only)
```graphql
query GetMyRestaurant {
  getMyRestaurant {
    restoranId
    nama
    alamat
    jenisMasakan
    rating
    jamBuka
    biayaAntar
    isActive
    urlGambar
    telepon
    deskripsi
    menuItems {
      itemMenuId
      nama
      deskripsi
      harga
      kategori
      isAvailable
    }
  }
}
```

#### `searchRestaurants`
**Description**: Search restaurants by name, cuisine type, address, or description
```graphql
query SearchRestaurants($searchTerm: String!, $limit: Int) {
  searchRestaurants(searchTerm: $searchTerm, limit: $limit) {
    restoranId
    nama
    alamat
    jenisMasakan
    rating
    biayaAntar
    urlGambar
    telepon
  }
}
```

#### `getRestaurantsByType`
**Description**: Get restaurants by cuisine type
```graphql
query GetRestaurantsByType($jenisMasakan: String!) {
  getRestaurantsByType(jenisMasakan: $jenisMasakan) {
    restoranId
    nama
    alamat
    rating
    biayaAntar
    urlGambar
  }
}
```

#### `getPopularRestaurants`
**Description**: Get popular restaurants
```graphql
query GetPopularRestaurants($limit: Int) {
  getPopularRestaurants(limit: $limit) {
    restoranId
    nama
    alamat
    jenisMasakan
    rating
    biayaAntar
    urlGambar
  }
}
```

### Menu Item Queries

#### `getMenuItemById`
**Description**: Get menu item by ID
```graphql
query GetMenuItemById($id: ID!) {
  getMenuItemById(id: $id) {
    itemMenuId
    nama
    deskripsi
    harga
    urlGambar
    isAvailable
    kategori
    createdAt
    updatedAt
    restoran {
      restoranId
      nama
    }
  }
}
```

#### `getMenuItemsByRestaurant`
**Description**: Get all menu items for a restaurant
```graphql
query GetMenuItemsByRestaurant($restoranId: ID!) {
  getMenuItemsByRestaurant(restoranId: $restoranId) {
    itemMenuId
    nama
    deskripsi
    harga
    urlGambar
    isAvailable
    kategori
  }
}
```

#### `getMenuItemsByCategory`
**Description**: Get menu items by category for a restaurant
```graphql
query GetMenuItemsByCategory($restoranId: ID!, $kategori: String!) {
  getMenuItemsByCategory(restoranId: $restoranId, kategori: $kategori) {
    itemMenuId
    nama
    deskripsi
    harga
    urlGambar
    isAvailable
  }
}
```

#### `searchMenuItems`
**Description**: Search menu items within a restaurant
```graphql
query SearchMenuItems($restoranId: ID!, $searchTerm: String!) {
  searchMenuItems(restoranId: $restoranId, searchTerm: $searchTerm) {
    itemMenuId
    nama
    deskripsi
    harga
    kategori
    isAvailable
  }
}
```

### Restaurant Mutations

#### `createRestaurant`
**Description**: Create new restaurant (Restaurant access only)
```graphql
mutation CreateRestaurant($input: CreateRestaurantInput!) {
  createRestaurant(input: $input) {
    restoranId
    nama
    alamat
    jenisMasakan
    jamBuka
    biayaAntar
    telepon
    deskripsi
    urlGambar
    isActive
  }
}
```

#### `updateRestaurant`
**Description**: Update restaurant (Restaurant access only)
```graphql
mutation UpdateRestaurant($id: ID!, $input: UpdateRestaurantInput!) {
  updateRestaurant(id: $id, input: $input) {
    restoranId
    nama
    alamat
    jenisMasakan
    jamBuka
    biayaAntar
    telepon
    deskripsi
    urlGambar
    isActive
    updatedAt
  }
}
```

#### `deleteRestaurant`
**Description**: Delete restaurant (Restaurant access only)
```graphql
mutation DeleteRestaurant($id: ID!) {
  deleteRestaurant(id: $id)
}
```

#### `toggleRestaurantStatus`
**Description**: Toggle restaurant active/inactive status
```graphql
mutation ToggleRestaurantStatus($id: ID!) {
  toggleRestaurantStatus(id: $id) {
    restoranId
    nama
    isActive
    updatedAt
  }
}
```

### Menu Item Mutations

#### `createMenuItem`
**Description**: Create new menu item (Restaurant access only)
```graphql
mutation CreateMenuItem($input: CreateMenuItemInput!) {
  createMenuItem(input: $input) {
    itemMenuId
    nama
    deskripsi
    harga
    kategori
    urlGambar
    isAvailable
  }
}
```

#### `updateMenuItem`
**Description**: Update menu item (Restaurant access only)
```graphql
mutation UpdateMenuItem($id: ID!, $input: UpdateMenuItemInput!) {
  updateMenuItem(id: $id, input: $input) {
    itemMenuId
    nama
    deskripsi
    harga
    kategori
    urlGambar
    isAvailable
    updatedAt
  }
}
```

#### `deleteMenuItem`
**Description**: Delete menu item (Restaurant access only)
```graphql
mutation DeleteMenuItem($id: ID!) {
  deleteMenuItem(id: $id)
}
```

#### `toggleMenuItemAvailability`
**Description**: Toggle menu item availability
```graphql
mutation ToggleMenuItemAvailability($id: ID!) {
  toggleMenuItemAvailability(id: $id) {
    itemMenuId
    nama
    isAvailable
    updatedAt
  }
}
```

#### `bulkUpdateMenuItems`
**Description**: Bulk update menu items availability
```graphql
mutation BulkUpdateMenuItems($restoranId: ID!, $isAvailable: Boolean!) {
  bulkUpdateMenuItems(restoranId: $restoranId, isAvailable: $isAvailable) {
    itemMenuId
    nama
    isAvailable
    updatedAt
  }
}
```

#### `bulkDeleteMenuItems`
**Description**: Bulk delete menu items
```graphql
mutation BulkDeleteMenuItems($itemIds: [ID!]!) {
  bulkDeleteMenuItems(itemIds: $itemIds)
}
```

---

## 🚗 DELIVERY DRIVER MANAGEMENT

### Queries

#### `getAllDrivers`
**Description**: Get all drivers (Admin access only)
```graphql
query GetAllDrivers(
  $filter: DriverFilter
  $sortBy: DriverSortBy
  $limit: Int
  $offset: Int
) {
  getAllDrivers(
    filter: $filter
    sortBy: $sortBy
    limit: $limit
    offset: $offset
  ) {
    pengemudiId
    namaPengemudi
    telepon
    detailKendaraan
    status
    lokasiSaatIni
    rating
    totalDeliveries
    isActive
    createdAt
    updatedAt
  }
}
```

#### `getDriverById`
**Description**: Get driver by ID
```graphql
query GetDriverById($id: ID!) {
  getDriverById(id: $id) {
    pengemudiId
    namaPengemudi
    telepon
    detailKendaraan
    status
    lokasiSaatIni
    rating
    totalDeliveries
    isActive
    createdAt
    updatedAt
  }
}
```

#### `getMyDriverProfile`
**Description**: Get current driver's profile (Driver access only)
```graphql
query GetMyDriverProfile {
  getMyDriverProfile {
    pengemudiId
    namaPengemudi
    telepon
    detailKendaraan
    status
    lokasiSaatIni
    rating
    totalDeliveries
    isActive
  }
}
```

#### `getAvailableOrders`
**Description**: Get orders available for delivery (Driver access only)
```graphql
query GetAvailableOrders($limit: Int) {
  getAvailableOrders(limit: $limit) {
    pesananId
    alamatAntar
    jumlahTotal
    estimasiWaktu
    restoran {
      nama
      alamat
    }
    pengguna {
      namaPengguna
      telepon
    }
  }
}
```

#### `getMyActiveDelivery`
**Description**: Get driver's active delivery (Driver access only)
```graphql
query GetMyActiveDelivery {
  getMyActiveDelivery {
    pesananId
    alamatAntar
    jumlahTotal
    status
    estimasiWaktu
    restoran {
      nama
      alamat
      telepon
    }
    pengguna {
      namaPengguna
      telepon
    }
  }
}
```

#### `getMyDeliveryHistory`
**Description**: Get driver's delivery history (Driver access only)
```graphql
query GetMyDeliveryHistory($limit: Int, $offset: Int) {
  getMyDeliveryHistory(limit: $limit, offset: $offset) {
    pesananId
    alamatAntar
    jumlahTotal
    status
    tanggalPesanan
    restoran {
      nama
    }
  }
}
```

### Driver Mutations

#### `createDriverProfile`
**Description**: Create driver profile (Driver access only)
```graphql
mutation CreateDriverProfile($input: CreateDriverInput!) {
  createDriverProfile(input: $input) {
    pengemudiId
    namaPengemudi
    telepon
    detailKendaraan
    status
    lokasiSaatIni
    rating
    totalDeliveries
    isActive
  }
}
```

#### `updateDriverProfile`
**Description**: Update driver profile (Driver access only)
```graphql
mutation UpdateDriverProfile($input: UpdateDriverInput!) {
  updateDriverProfile(input: $input) {
    pengemudiId
    namaPengemudi
    telepon
    detailKendaraan
    lokasiSaatIni
    updatedAt
  }
}
```

#### `deleteDriverProfile`
**Description**: Delete driver profile (Driver access only)
```graphql
mutation DeleteDriverProfile {
  deleteDriverProfile
}
```

#### `acceptOrder`
**Description**: Accept delivery order (Driver access only)
```graphql
mutation AcceptOrder($orderId: ID!) {
  acceptOrder(orderId: $orderId) {
    pesananId
    status
    pengemudiId
    updatedAt
  }
}
```

#### `updateDriverStatus`
**Description**: Update driver status (Driver access only)
```graphql
mutation UpdateDriverStatus($status: DriverStatus!) {
  updateDriverStatus(status: $status) {
    pengemudiId
    status
    updatedAt
  }
}
```

#### `goOnline`
**Description**: Set driver status to online (Driver access only)
```graphql
mutation GoOnline {
  goOnline {
    pengemudiId
    status
    updatedAt
  }
}
```

#### `goOffline`
**Description**: Set driver status to offline (Driver access only)
```graphql
mutation GoOffline {
  goOffline {
    pengemudiId
    status
    updatedAt
  }
}
```

#### `startDelivery`
**Description**: Start delivery for an order (Driver access only)
```graphql
mutation StartDelivery($orderId: ID!) {
  startDelivery(orderId: $orderId) {
    pengemudiId
    status
    updatedAt
  }
}
```

#### `completeDelivery`
**Description**: Complete delivery for an order (Driver access only)
```graphql
mutation CompleteDelivery($orderId: ID!) {
  completeDelivery(orderId: $orderId) {
    pengemudiId
    status
    totalDeliveries
    updatedAt
  }
}
```

#### `updateDriverLocation`
**Description**: Update driver location (Driver access only)
```graphql
mutation UpdateDriverLocation($input: UpdateDriverLocationInput!) {
  updateDriverLocation(input: $input) {
    pengemudiId
    lokasiSaatIni
    updatedAt
  }
}
```

---

## 📦 ORDER MANAGEMENT

### Queries

#### `getAllOrders`
**Description**: Get all orders (Restaurant access only)
```graphql
query GetAllOrders(
  $filter: OrderFilter
  $sortBy: OrderSortBy
  $limit: Int
  $offset: Int
) {
  getAllOrders(
    filter: $filter
    sortBy: $sortBy
    limit: $limit
    offset: $offset
  ) {
    pesananId
    tanggalPesanan
    jumlahTotal
    status
    alamatAntar
    metodePembayaran
    catatanPesanan
    estimasiWaktu
    biayaOngkir
    biayaLayanan
    totalBiaya
    createdAt
    updatedAt
    pengguna {
      namaPengguna
      telepon
    }
    restoran {
      nama
    }
    pengemudi {
      namaPengemudi
    }
    totalItems
  }
}
```

#### `getOrderById`
**Description**: Get order by ID
```graphql
query GetOrderById($id: ID!) {
  getOrderById(id: $id) {
    pesananId
    tanggalPesanan
    jumlahTotal
    status
    alamatAntar
    metodePembayaran
    catatanPesanan
    estimasiWaktu
    biayaOngkir
    biayaLayanan
    totalBiaya
    createdAt
    updatedAt
    pengguna {
      namaPengguna
      telepon
      alamat
    }
    restoran {
      nama
      alamat
      telepon
    }
    pengemudi {
      namaPengemudi
      telepon
    }
    items {
      itemPesananId
      quantity
      instruksiKhusus
      hargaSatuan
      totalHarga
      menuItem {
        nama
        deskripsi
      }
    }
  }
}
```

#### `getMyOrders`
**Description**: Get current user's orders
```graphql
query GetMyOrders($limit: Int, $offset: Int) {
  getMyOrders(limit: $limit, offset: $offset) {
    pesananId
    tanggalPesanan
    jumlahTotal
    status
    alamatAntar
    metodePembayaran
    estimasiWaktu
    totalBiaya
    restoran {
      nama
      alamat
    }
    pengemudi {
      namaPengemudi
      telepon
    }
    totalItems
  }
}
```

#### `getActiveOrders`
**Description**: Get active orders (non-completed/cancelled)
```graphql
query GetActiveOrders {
  getActiveOrders {
    pesananId
    tanggalPesanan
    jumlahTotal
    status
    alamatAntar
    estimasiWaktu
    restoran {
      nama
      alamat
    }
    pengemudi {
      namaPengemudi
    }
  }
}
```

#### `getPendingOrders`
**Description**: Get pending orders (Restaurant access only)
```graphql
query GetPendingOrders {
  getPendingOrders {
    pesananId
    tanggalPesanan
    jumlahTotal
    alamatAntar
    metodePembayaran
    catatanPesanan
    pengguna {
      namaPengguna
      telepon
      alamat
    }
    items {
      quantity
      instruksiKhusus
      menuItem {
        nama
        harga
      }
    }
  }
}
```

#### `getOrderHistory`
**Description**: Get completed/cancelled orders
```graphql
query GetOrderHistory($limit: Int, $offset: Int) {
  getOrderHistory(limit: $limit, offset: $offset) {
    pesananId
    tanggalPesanan
    jumlahTotal
    status
    alamatAntar
    totalBiaya
    restoran {
      nama
    }
  }
}
```

#### `getOrderStats`
**Description**: Get order statistics
```graphql
query GetOrderStats(
  $restoranId: ID
  $driverId: ID
  $dateFrom: String
  $dateTo: String
) {
  getOrderStats(
    restoranId: $restoranId
    driverId: $driverId
    dateFrom: $dateFrom
    dateTo: $dateTo
  ) {
    totalOrders
    totalRevenue
    averageOrderValue
    completedOrders
    cancelledOrders
    pendingOrders
  }
}
```

#### `searchOrders`
**Description**: Search orders (Restaurant access only)
```graphql
query SearchOrders($searchTerm: String!, $limit: Int) {
  searchOrders(searchTerm: $searchTerm, limit: $limit) {
    pesananId
    tanggalPesanan
    jumlahTotal
    status
    alamatAntar
    pengguna {
      namaPengguna
    }
  }
}
```

### Order Mutations

#### `createOrder`
**Description**: Create new order (Customer access only)
```graphql
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    pesananId
    tanggalPesanan
    jumlahTotal
    status
    alamatAntar
    metodePembayaran
    catatanPesanan
    biayaOngkir
    biayaLayanan
    totalBiaya
    restoran {
      nama
      alamat
    }
  }
}
```

#### `confirmOrder`
**Description**: Confirm order (Restaurant access only)
```graphql
mutation ConfirmOrder($orderId: ID!, $estimasiWaktu: String) {
  confirmOrder(orderId: $orderId, estimasiWaktu: $estimasiWaktu) {
    pesananId
    status
    estimasiWaktu
    updatedAt
  }
}
```

#### `updateOrderStatus`
**Description**: Update order status
```graphql
mutation UpdateOrderStatus($input: UpdateOrderStatusInput!) {
  updateOrderStatus(input: $input) {
    pesananId
    status
    estimasiWaktu
    updatedAt
  }
}
```

#### `cancelOrder`
**Description**: Cancel order
```graphql
mutation CancelOrder($orderId: ID!, $reason: String) {
  cancelOrder(orderId: $orderId, reason: $reason) {
    pesananId
    status
    catatanPesanan
    updatedAt
  }
}
```

#### `rejectOrder`
**Description**: Reject order (Restaurant access only)
```graphql
mutation RejectOrder($orderId: ID!, $reason: String!) {
  rejectOrder(orderId: $orderId, reason: $reason) {
    pesananId
    status
    catatanPesanan
    updatedAt
  }
}
```

#### `acceptDelivery`
**Description**: Accept order for delivery (Driver access only)
```graphql
mutation AcceptDelivery($orderId: ID!) {
  acceptDelivery(orderId: $orderId) {
    pesananId
    status
    pengemudiId
    updatedAt
  }
}
```

---

## 🛒 ORDER ITEM MANAGEMENT

### Queries

#### `getOrderItemById`
**Description**: Get order item by ID
```graphql
query GetOrderItemById($id: ID!) {
  getOrderItemById(id: $id) {
    itemPesananId
    quantity
    instruksiKhusus
    hargaSatuan
    totalHarga
    createdAt
    updatedAt
    pesanan {
      pesananId
      status
    }
    menuItem {
      nama
      deskripsi
      urlGambar
    }
  }
}
```

#### `getOrderItemsByOrder`
**Description**: Get all order items for an order
```graphql
query GetOrderItemsByOrder($orderId: ID!) {
  getOrderItemsByOrder(orderId: $orderId) {
    itemPesananId
    quantity
    instruksiKhusus
    hargaSatuan
    totalHarga
    menuItem {
      nama
      deskripsi
      urlGambar
    }
  }
}
```

#### `getOrderItemsByMenuItem`
**Description**: Get order items for a specific menu item
```graphql
query GetOrderItemsByMenuItem($menuItemId: ID!, $limit: Int) {
  getOrderItemsByMenuItem(menuItemId: $menuItemId, limit: $limit) {
    itemPesananId
    quantity
    totalHarga
    createdAt
    pesanan {
      pesananId
      status
      tanggalPesanan
    }
  }
}
```

#### `getPopularOrderItems`
**Description**: Get popular order items for a restaurant
```graphql
query GetPopularOrderItems($restoranId: ID, $limit: Int) {
  getPopularOrderItems(restoranId: $restoranId, limit: $limit) {
    itemPesananId
    quantity
    totalHarga
    menuItem {
      nama
      harga
      urlGambar
    }
  }
}
```

#### `getOrderItemStats`
**Description**: Get order item statistics
```graphql
query GetOrderItemStats(
  $restoranId: ID
  $dateFrom: String
  $dateTo: String
) {
  getOrderItemStats(
    restoranId: $restoranId
    dateFrom: $dateFrom
    dateTo: $dateTo
  ) {
    totalQuantity
    totalValue
    averageQuantityPerOrder
    popularItems {
      nama
      harga
      kategori
    }
  }
}
```

### Order Item Mutations

#### `addItemToOrder`
**Description**: Add item to order (Customer access for pending orders)
```graphql
mutation AddItemToOrder($input: CreateOrderItemInput!) {
  addItemToOrder(input: $input) {
    itemPesananId
    quantity
    instruksiKhusus
    hargaSatuan
    totalHarga
    menuItem {
      nama
      harga
    }
  }
}
```

#### `updateOrderItem`
**Description**: Update order item (Customer access for pending orders)
```graphql
mutation UpdateOrderItem($id: ID!, $input: UpdateOrderItemInput!) {
  updateOrderItem(id: $id, input: $input) {
    itemPesananId
    quantity
    instruksiKhusus
    totalHarga
    updatedAt
  }
}
```

#### `removeItemFromOrder`
**Description**: Remove item from order (Customer access for pending orders)
```graphql
mutation RemoveItemFromOrder($id: ID!) {
  removeItemFromOrder(id: $id)
}
```

#### `addMultipleItemsToOrder`
**Description**: Add multiple items to order
```graphql
mutation AddMultipleItemsToOrder(
  $pesananId: ID!
  $items: [OrderItemInput!]!
) {
  addMultipleItemsToOrder(pesananId: $pesananId, items: $items) {
    itemPesananId
    quantity
    totalHarga
    menuItem {
      nama
      harga
    }
  }
}
```

#### `removeMultipleItemsFromOrder`
**Description**: Remove multiple items from order
```graphql
mutation RemoveMultipleItemsFromOrder($itemIds: [ID!]!) {
  removeMultipleItemsFromOrder(itemIds: $itemIds)
}
```

#### `updateOrderItemQuantities`
**Description**: Update quantities for multiple order items
```graphql
mutation UpdateOrderItemQuantities($updates: [OrderItemQuantityUpdate!]!) {
  updateOrderItemQuantities(updates: $updates) {
    itemPesananId
    quantity
    totalHarga
    updatedAt
  }
}
```

---

## 📊 ENUMS AND INPUT TYPES

### Role Enum
```graphql
enum Role {
  Customer
  Driver
  Restaurant
}
```

### Order Status Enum
```graphql
enum OrderStatus {
  pending
  confirmed
  preparing
  ready
  delivering
  completed
  cancelled
}
```

### Payment Method Enum
```graphql
enum PaymentMethod {
  cash
  credit_card
  debit_card
  e_wallet
  bank_transfer
}
```

### Driver Status Enum
```graphql
enum DriverStatus {
  Online
  Offline
  Delivering
}
```

### Sort By Enums
```graphql
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
```

---

## 🔧 EXAMPLE USAGE SCENARIOS

### 1. User Registration and Login
```graphql
# Register a customer
mutation {
  registerUser(
    email: "customer@example.com"
    namaPengguna: "John Doe"
    password: "password123"
    role: Customer
    telepon: "081234567890"
    alamat: "Jl. Example No. 123"
  ) {
    token
    user {
      penggunaId
      email
      namaPengguna
      role
    }
  }
}

# Login
mutation {
  loginUser(email: "customer@example.com", password: "password123") {
    token
    user {
      penggunaId
      email
      role
    }
  }
}
```

### 2. Browse Restaurants and Menu Items
```graphql
# Get popular restaurants
query {
  getPopularRestaurants(limit: 10) {
    restoranId
    nama
    alamat
    jenisMasakan
    rating
    biayaAntar
    urlGambar
  }
}

# Get restaurant menu
query {
  getMenuItemsByRestaurant(restoranId: "1") {
    itemMenuId
    nama
    deskripsi
    harga
    kategori
    urlGambar
    isAvailable
  }
}
```

### 3. Create Order
```graphql
mutation {
  createOrder(input: {
    restoranId: "1"
    alamatAntar: "Jl. Delivery Address No. 456"
    metodePembayaran: e_wallet
    catatanPesanan: "Extra spicy please"
    items: [
      {
        itemMenuId: "1"
        quantity: 2
        instruksiKhusus: "No onions"
      },
      {
        itemMenuId: "2"
        quantity: 1
      }
    ]
  }) {
    pesananId
    jumlahTotal
    status
    totalBiaya
  }
}
```

### 4. Restaurant Order Management
```graphql
# Get pending orders (Restaurant)
query {
  getPendingOrders {
    pesananId
    tanggalPesanan
    jumlahTotal
    alamatAntar
    pengguna {
      namaPengguna
      telepon
    }
    items {
      quantity
      menuItem {
        nama
      }
    }
  }
}

# Confirm order (Restaurant)
mutation {
  confirmOrder(orderId: "1", estimasiWaktu: "30 minutes") {
    pesananId
    status
    estimasiWaktu
  }
}
```

### 5. Driver Operations
```graphql
# Go online (Driver)
mutation {
  goOnline {
    pengemudiId
    status
  }
}

# Get available orders (Driver)
query {
  getAvailableOrders(limit: 5) {
    pesananId
    alamatAntar
    jumlahTotal
    restoran {
      nama
      alamat
    }
  }
}

# Accept order (Driver)
mutation {
  acceptOrder(orderId: "1") {
    pesananId
    status
    pengemudiId
  }
}
```

---

## 🚀 Testing Your API

You can test your API at: **http://localhost:4000/graphql**

Use the GraphQL Playground to:
1. Browse the schema documentation
2. Test queries and mutations
3. Check authentication with JWT tokens
4. Validate input/output data

Remember to include the Authorization header for protected routes:
```
{
  "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
}
``` 