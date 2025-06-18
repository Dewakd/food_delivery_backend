# 🍕 Food Delivery Backend API

A complete GraphQL-based food delivery backend built with Node.js, Apollo Server, Prisma ORM, and MySQL.

## 🚀 Features

- **Complete User Management** with JWT authentication
- **Restaurant Management** with menu items
- **Order Management** with full lifecycle tracking
- **Delivery Driver Management** with real-time status
- **Role-based Access Control** (Customer, Restaurant, Driver)
- **Comprehensive Analytics** and statistics
- **Real-time Order Tracking**
- **Advanced Filtering and Search**

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **GraphQL** with Apollo Server - API layer
- **Prisma ORM** - Database management
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **ES6 Modules** - Modern JavaScript

## 📋 Prerequisites

- Node.js (v16+)
- MySQL database
- npm or yarn

## ⚡ Quick Start

### 1. Clone and Install
```bash
git clone <your-repo>
cd food_delivery_backend
npm install
```

### 2. Environment Setup
Create a `.env` file:
```env
DATABASE_URL="mysql://username:password@localhost:3306/food_delivery_db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=4000
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Apply schema to database
npx prisma db push

# (Optional) View your database
npx prisma studio
```

### 4. Start Server
```bash
npm start
# or for development
npm run dev
```

The GraphQL Playground will be available at: **http://localhost:4000/graphql**

## 📚 API Documentation

Check out the complete API documentation in [`API_REFERENCE.md`](./API_REFERENCE.md) for all available queries and mutations.

## 🧪 Testing

Use the test queries in [`test_queries.graphql`](./test_queries.graphql) to test your API:

### Basic Test Flow

1. **Register Users**
   ```graphql
   # Register a customer
   mutation RegisterCustomer {
     registerUser(
       email: "customer@test.com"
       password: "password123"
       role: Customer
       namaPengguna: "Test Customer"
     ) {
       token
       user { penggunaId email role }
     }
   }
   ```

2. **Create Restaurant** (as Restaurant user)
   ```graphql
   mutation CreateRestaurant {
     createRestaurant(input: {
       nama: "Test Restaurant"
       alamat: "Jl. Test No. 123"
       jenisMasakan: "Indonesian"
     }) {
       restoranId nama
     }
   }
   ```

3. **Create Order** (as Customer)
   ```graphql
   mutation CreateOrder {
     createOrder(input: {
       restoranId: "1"
       alamatAntar: "Jl. Delivery Address"
       metodePembayaran: e_wallet
       items: [{ itemMenuId: "1", quantity: 2 }]
     }) {
       pesananId status totalBiaya
     }
   }
   ```

## 🔐 Authentication

Include JWT token in request headers:
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
}
```

## 🎯 User Roles & Permissions

### Customer
- Create and manage orders
- View restaurants and menus
- Track order status
- Update profile

### Restaurant
- Manage restaurant information
- Create and manage menu items
- Process orders (confirm/reject)
- View order analytics
- Manage user accounts

### Driver
- Create and manage driver profile
- Accept delivery orders
- Update order status
- Track delivery history
- Update location

## 🗃️ Database Schema

### Core Entities

- **USER** - User accounts with roles
- **RESTAURANT** - Restaurant information
- **MENU_ITEM** - Menu items for restaurants
- **ORDER** - Order management
- **ORDER_ITEM** - Individual items in orders
- **DELIVERY_DRIVER** - Driver profiles

### Key Relationships

- User → Orders (Customer orders)
- Restaurant → Menu Items
- Restaurant → Orders (Restaurant receives orders)
- Order → Order Items
- Driver → Orders (Driver delivers orders)

## 📊 Available Operations

### Queries (Read Operations)
- User management and profiles
- Restaurant browsing and search
- Menu item exploration
- Order tracking and history
- Driver management
- Analytics and statistics

### Mutations (Write Operations)
- User registration and authentication
- Restaurant and menu management
- Order creation and status updates
- Driver operations
- Bulk operations

### Advanced Features
- Filtering and sorting
- Search functionality
- Real-time status updates
- Analytics dashboards
- Role-based security

## 🔧 Project Structure

```
food_delivery_backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── resolvers/    # GraphQL resolvers
│   │   └── schemas/      # GraphQL schemas
│   ├── utils/           # Utility functions (auth, etc.)
│   └── index.js         # Main application entry
├── prisma/
│   └── schema.prisma    # Database schema
├── API_REFERENCE.md     # Complete API documentation
├── test_queries.graphql # Test queries for development
└── package.json
```

## 🚦 Order Flow

1. **Customer** creates order with menu items
2. **Restaurant** receives order notification
3. **Restaurant** confirms order and sets estimated time
4. **Restaurant** prepares order and marks as ready
5. **Driver** sees available orders and accepts delivery
6. **Driver** picks up order and starts delivery
7. **Driver** completes delivery
8. **Order** is marked as completed

## 📈 Analytics Available

- Order statistics (total, revenue, average value)
- Restaurant performance metrics
- Driver delivery statistics
- Popular menu items analysis
- Time-based filtering for reports

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based authorization
- Input validation
- SQL injection prevention (via Prisma)

## 🐛 Error Handling

The API includes comprehensive error handling:
- Authentication errors (401)
- Authorization errors (403)
- Validation errors (400)
- Not found errors (404)
- Server errors (500)

## 🚀 Production Deployment

1. Set up production database
2. Configure environment variables
3. Run database migrations
4. Deploy to your preferred platform (AWS, DigitalOcean, etc.)
5. Set up monitoring and logging

## 📝 Development Tips

- Use GraphQL Playground for testing
- Check `API_REFERENCE.md` for complete documentation
- Use `test_queries.graphql` for development testing
- Monitor database with `npx prisma studio`
- Enable detailed logging for debugging

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

---

**Happy Coding! 🍕🚀**

For any questions or issues, please check the API documentation or create an issue in the repository. 