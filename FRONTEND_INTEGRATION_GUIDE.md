# Flutter Integration Guide - Food Delivery App

This guide provides step-by-step instructions for integrating your food delivery backend with your existing Flutter UI.

## 📋 Prerequisites

- Food delivery backend running on `http://localhost:4000/graphql`
- Flutter project with UI already set up
- Basic knowledge of GraphQL and Flutter
- Understanding of JWT authentication

---

## 🛠️ Step 1: Add Dependencies

Add these packages to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # GraphQL
  graphql_flutter: ^5.1.2
  
  # Authentication & Storage
  jwt_decoder: ^2.0.1
  shared_preferences: ^2.2.2
  
  # State Management
  provider: ^6.0.5
  
  # HTTP & Network
  http: ^1.1.0
  
  # UI & Utils
  fluttertoast: ^8.2.4
  cached_network_image: ^3.3.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
```

Run: `flutter pub get`

---

## 🔌 Step 2: GraphQL Client Setup

Create `lib/services/graphql_service.dart`:

```dart
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

class GraphQLService {
  static GraphQLClient? _client;
  
  static Future<GraphQLClient> getClient() async {
    if (_client == null) {
      final HttpLink httpLink = HttpLink('http://10.0.2.2:4000/graphql');
      
      final AuthLink authLink = AuthLink(
        getToken: () async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('auth_token');
          return token != null ? 'Bearer $token' : null;
        },
      );
      
      final Link link = authLink.concat(httpLink);
      
      _client = GraphQLClient(
        link: link,
        cache: GraphQLCache(store: InMemoryStore()),
      );
    }
    
    return _client!;
  }
  
  static void resetClient() {
    _client = null;
  }
}
```

---

## 🔐 Step 3: Authentication Service

Create `lib/services/auth_service.dart`:

```dart
import 'dart:convert';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'graphql_service.dart';

class AuthService {
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'user_data';
  
  static const String loginMutation = '''
    mutation LoginUser(\$email: String!, \$password: String!) {
      loginUser(email: \$email, password: \$password) {
        token
        user {
          penggunaId
          email
          namaPengguna
          role
          telepon
          alamat
        }
      }
    }
  ''';
  
  static const String registerMutation = '''
    mutation RegisterUser(
      \$email: String!
      \$namaPengguna: String
      \$password: String!
      \$role: Role!
      \$telepon: String
      \$alamat: String
    ) {
      registerUser(
        email: \$email
        namaPengguna: \$namaPengguna
        password: \$password
        role: \$role
        telepon: \$telepon
        alamat: \$alamat
      ) {
        token
        user {
          penggunaId
          email
          namaPengguna
          role
          telepon
          alamat
        }
      }
    }
  ''';
  
  static Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      final client = await GraphQLService.getClient();
      final result = await client.mutate(
        MutationOptions(
          document: gql(loginMutation),
          variables: {'email': email, 'password': password},
        ),
      );
      
      if (result.hasException) {
        throw Exception(result.exception.toString());
      }
      
      final data = result.data!['loginUser'];
      await saveAuthData(data['token'], data['user']);
      return data;
    } catch (e) {
      throw Exception('Login failed: $e');
    }
  }
  
  static Future<Map<String, dynamic>?> register({
    required String email,
    required String password,
    required String role,
    String? namaPengguna,
    String? telepon,
    String? alamat,
  }) async {
    try {
      final client = await GraphQLService.getClient();
      final result = await client.mutate(
        MutationOptions(
          document: gql(registerMutation),
          variables: {
            'email': email,
            'password': password,
            'role': role,
            'namaPengguna': namaPengguna,
            'telepon': telepon,
            'alamat': alamat,
          },
        ),
      );
      
      if (result.hasException) {
        throw Exception(result.exception.toString());
      }
      
      final data = result.data!['registerUser'];
      await saveAuthData(data['token'], data['user']);
      return data;
    } catch (e) {
      throw Exception('Registration failed: $e');
    }
  }
  
  static Future<void> saveAuthData(String token, Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userKey, jsonEncode(user));
  }
  
  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    
    if (token == null) return false;
    
    try {
      return !JwtDecoder.isExpired(token);
    } catch (e) {
      return false;
    }
  }
  
  static Future<Map<String, dynamic>?> getCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userString = prefs.getString(_userKey);
    
    if (userString == null) return null;
    
    return jsonDecode(userString);
  }
  
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
    GraphQLService.resetClient();
  }
}
```

---

## 📱 Step 4: State Management with Provider

Create `lib/providers/auth_provider.dart`:

```dart
import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  Map<String, dynamic>? _user;
  bool _isLoading = false;
  bool _isLoggedIn = false;
  
  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _isLoggedIn;
  String? get userRole => _user?['role'];
  
  Future<void> checkAuthStatus() async {
    _isLoading = true;
    notifyListeners();
    
    _isLoggedIn = await AuthService.isLoggedIn();
    if (_isLoggedIn) {
      _user = await AuthService.getCurrentUser();
    }
    
    _isLoading = false;
    notifyListeners();
  }
  
  Future<bool> login(String email, String password) async {
    try {
      _isLoading = true;
      notifyListeners();
      
      final result = await AuthService.login(email, password);
      if (result != null) {
        _user = result['user'];
        _isLoggedIn = true;
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<bool> register({
    required String email,
    required String password,
    required String role,
    String? namaPengguna,
    String? telepon,
    String? alamat,
  }) async {
    try {
      _isLoading = true;
      notifyListeners();
      
      final result = await AuthService.register(
        email: email,
        password: password,
        role: role,
        namaPengguna: namaPengguna,
        telepon: telepon,
        alamat: alamat,
      );
      
      if (result != null) {
        _user = result['user'];
        _isLoggedIn = true;
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }
  
  Future<void> logout() async {
    await AuthService.logout();
    _user = null;
    _isLoggedIn = false;
    notifyListeners();
  }
}
```

---

## 🏪 Step 5: Restaurant Service

Create `lib/services/restaurant_service.dart`:

```dart
import 'package:graphql_flutter/graphql_flutter.dart';
import 'graphql_service.dart';

class RestaurantService {
  static const String getAllRestaurantsQuery = '''
    query GetAllRestaurants(\$limit: Int) {
      getAllRestaurants(limit: \$limit) {
        restoranId
        nama
        alamat
        jenisMasakan
        rating
        jamBuka
        biayaAntar
        isActive
        urlGambar
        totalOrders
        averageRating
      }
    }
  ''';
  
  static const String getRestaurantByIdQuery = '''
    query GetRestaurantById(\$id: ID!) {
      getRestaurantById(id: \$id) {
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
          urlGambar
          isAvailable
        }
      }
    }
  ''';
  
  static Future<List<dynamic>> getAllRestaurants({int? limit}) async {
    try {
      final client = await GraphQLService.getClient();
      final result = await client.query(
        QueryOptions(
          document: gql(getAllRestaurantsQuery),
          variables: {'limit': limit},
        ),
      );
      
      if (result.hasException) {
        throw Exception(result.exception.toString());
      }
      
      return result.data!['getAllRestaurants'] ?? [];
    } catch (e) {
      throw Exception('Failed to load restaurants: $e');
    }
  }
  
  static Future<Map<String, dynamic>?> getRestaurantById(String id) async {
    try {
      final client = await GraphQLService.getClient();
      final result = await client.query(
        QueryOptions(
          document: gql(getRestaurantByIdQuery),
          variables: {'id': id},
        ),
      );
      
      if (result.hasException) {
        throw Exception(result.exception.toString());
      }
      
      return result.data!['getRestaurantById'];
    } catch (e) {
      throw Exception('Failed to load restaurant: $e');
    }
  }
}
```

---

## 🛒 Step 6: Cart Management

Create `lib/providers/cart_provider.dart`:

```dart
import 'package:flutter/material.dart';

class CartItem {
  final String itemMenuId;
  final String nama;
  final double harga;
  final String? urlGambar;
  int quantity;
  
  CartItem({
    required this.itemMenuId,
    required this.nama,
    required this.harga,
    this.urlGambar,
    this.quantity = 1,
  });
  
  double get totalPrice => harga * quantity;
}

class CartProvider with ChangeNotifier {
  List<CartItem> _items = [];
  Map<String, dynamic>? _restaurant;
  
  List<CartItem> get items => _items;
  Map<String, dynamic>? get restaurant => _restaurant;
  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);
  double get totalPrice => _items.fold(0, (sum, item) => sum + item.totalPrice);
  
  void addItem(Map<String, dynamic> menuItem, Map<String, dynamic> restaurant) {
    if (_restaurant != null && _restaurant!['restoranId'] != restaurant['restoranId']) {
      _items.clear();
    }
    
    _restaurant = restaurant;
    
    final existingIndex = _items.indexWhere(
      (item) => item.itemMenuId == menuItem['itemMenuId'],
    );
    
    if (existingIndex >= 0) {
      _items[existingIndex].quantity++;
    } else {
      _items.add(
        CartItem(
          itemMenuId: menuItem['itemMenuId'],
          nama: menuItem['nama'],
          harga: menuItem['harga'].toDouble(),
          urlGambar: menuItem['urlGambar'],
        ),
      );
    }
    
    notifyListeners();
  }
  
  void removeItem(String itemMenuId) {
    _items.removeWhere((item) => item.itemMenuId == itemMenuId);
    if (_items.isEmpty) {
      _restaurant = null;
    }
    notifyListeners();
  }
  
  void updateQuantity(String itemMenuId, int quantity) {
    final index = _items.indexWhere((item) => item.itemMenuId == itemMenuId);
    if (index >= 0) {
      if (quantity <= 0) {
        removeItem(itemMenuId);
      } else {
        _items[index].quantity = quantity;
        notifyListeners();
      }
    }
  }
  
  void clearCart() {
    _items.clear();
    _restaurant = null;
    notifyListeners();
  }
}
```

---

## 📦 Step 7: Order Service

Create `lib/services/order_service.dart`:

```dart
import 'package:graphql_flutter/graphql_flutter.dart';
import 'graphql_service.dart';

class OrderService {
  static const String createOrderMutation = '''
    mutation CreateOrder(\$input: CreateOrderInput!) {
      createOrder(input: \$input) {
        pesananId
        tanggalPesanan
        jumlahTotal
        status
        alamatAntar
        metodePembayaran
        totalBiaya
        restoran {
          nama
          alamat
        }
      }
    }
  ''';
  
  static const String getMyOrdersQuery = '''
    query GetMyOrders(\$limit: Int) {
      getMyOrders(limit: \$limit) {
        pesananId
        tanggalPesanan
        jumlahTotal
        status
        alamatAntar
        totalBiaya
        metodePembayaran
        restoran {
          nama
          alamat
        }
        pengemudi {
          namaPengemudi
          telepon
        }
        items {
          quantity
          harga
          menuItem {
            nama
            urlGambar
          }
        }
      }
    }
  ''';
  
  static Future<Map<String, dynamic>?> createOrder({
    required String restoranId,
    required List<Map<String, dynamic>> items,
    required String alamatAntar,
    required String metodePembayaran,
    String? catatan,
  }) async {
    try {
      final client = await GraphQLService.getClient();
      final result = await client.mutate(
        MutationOptions(
          document: gql(createOrderMutation),
          variables: {
            'input': {
              'restoranId': restoranId,
              'items': items,
              'alamatAntar': alamatAntar,
              'metodePembayaran': metodePembayaran,
              'catatan': catatan,
            }
          },
        ),
      );
      
      if (result.hasException) {
        throw Exception(result.exception.toString());
      }
      
      return result.data!['createOrder'];
    } catch (e) {
      throw Exception('Failed to create order: $e');
    }
  }
  
  static Future<List<dynamic>> getMyOrders({int? limit}) async {
    try {
      final client = await GraphQLService.getClient();
      final result = await client.query(
        QueryOptions(
          document: gql(getMyOrdersQuery),
          variables: {'limit': limit},
        ),
      );
      
      if (result.hasException) {
        throw Exception(result.exception.toString());
      }
      
      return result.data!['getMyOrders'] ?? [];
    } catch (e) {
      throw Exception('Failed to load orders: $e');
    }
  }
}
```

---

## 🎯 Step 8: Update Your Main App

Update your `lib/main.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'screens/splash_screen.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
      ],
      child: MaterialApp(
        title: 'Food Delivery',
        theme: ThemeData(
          primarySwatch: Colors.orange,
          visualDensity: VisualDensity.adaptivePlatformDensity,
        ),
        home: SplashScreen(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
```

---

## 🚀 Step 9: Create Splash Screen

Create `lib/screens/splash_screen.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class SplashScreen extends StatefulWidget {
  @override
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuthStatus();
  }
  
  _checkAuthStatus() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.checkAuthStatus();
    
    if (authProvider.isLoggedIn) {
    } else {
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}
```

---

## 📋 Integration Checklist

### ✅ Phase 1: Setup Complete
- [ ] Dependencies added to `pubspec.yaml`
- [ ] GraphQL service configured
- [ ] Authentication service implemented
- [ ] State management with Provider setup
- [ ] Main app updated with providers

### 🔄 Phase 2: Connect Your Existing Screens

#### Login Screen Integration:
```dart
final authProvider = Provider.of<AuthProvider>(context);

try {
  bool success = await authProvider.login(email, password);
  if (success) {
  }
} catch (e) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Login failed: $e')),
  );
}
```

#### Restaurant List Screen:
```dart
@override
void initState() {
  super.initState();
  _loadRestaurants();
}

_loadRestaurants() async {
  try {
    final restaurants = await RestaurantService.getAllRestaurants();
    setState(() {
    });
  } catch (e) {
  }
}
```

#### Cart Integration:
```dart
final cartProvider = Provider.of<CartProvider>(context);

cartProvider.addItem(menuItem, restaurant);
```

#### Order Creation:
```dart
final cartProvider = Provider.of<CartProvider>(context);

final orderItems = cartProvider.items.map((item) => {
  'itemMenuId': item.itemMenuId,
  'quantity': item.quantity,
}).toList();

try {
  final order = await OrderService.createOrder(
    restoranId: cartProvider.restaurant!['restoranId'],
    items: orderItems,
    alamatAntar: deliveryAddress,
    metodePembayaran: paymentMethod,
  );
  
  cartProvider.clearCart();
} catch (e) {
}
```

---

## 🔧 Next Steps

1. **Test Backend Connection**: Make sure your backend is running on `http://localhost:4000/graphql`
2. **Update IP Address**: Change `10.0.2.2` to your computer's IP if testing on physical device
3. **Connect Login Screen**: Integrate authentication with your existing login UI
4. **Connect Restaurant List**: Use `RestaurantService.getAllRestaurants()` in your restaurant list
5. **Integrate Cart**: Use `CartProvider` for cart functionality
6. **Connect Checkout**: Use `OrderService.createOrder()` for order placement
7. **Add Error Handling**: Implement proper error handling and loading states
8. **Test User Flows**: Test complete user journey from login to order completion

Need help with any specific screen integration? Let me know! 🚀 

## 🚗 Step 8: Driver Service

Create `lib/services/driver_service.dart`:

```dart
import 'package:graphql_flutter/graphql_flutter.dart';
import 'graphql_service.dart';

class DriverService {
  static const String getAvailableOrdersQuery = '''
    query GetAvailableOrders(\$limit: Int) {
      getAvailableOrders(limit: \$limit) {
        pesananId
        tanggalPesanan
        jumlahTotal
        alamatAntar
        totalBiaya
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
  ''';
  
  static const String getMyDeliveriesQuery = '''
    query GetMyDeliveries(\$limit: Int) {
      getMyDeliveries(limit: \$limit) {
        pesananId
        tanggalPesanan
        jumlahTotal
        status
        alamatAntar
        totalBiaya
        restoran {
          nama
          alamat
          telepon
        }
        pengguna {
          namaPengguna
          telepon
          alamat
        }
      }
    }
  ''';
  
  static const String acceptDeliveryMutation = '''
    mutation AcceptDelivery(\$orderId: ID!) {
      acceptDelivery(orderId: \$orderId) {
        pesananId
        status
        pengemudi {
          namaPengemudi
          status
        }
      }
    }
  ''';
  
  static const String completeDeliveryMutation = '''
    mutation CompleteDelivery(\$orderId: ID!) {
      completeDelivery(orderId: \$orderId) {
        pesananId
        status
      }
    }
  ''';
  
  static const String goOnlineMutation = '''
    mutation GoOnline {
      goOnline {
        pengemudiId
        status
      }
    }
  ''';
  
  static const String goOfflineMutation = '''
    mutation GoOffline {
      goOffline {
        pengemudiId
        status
      }
    }
  ''';
  
  static const String updateLocationMutation = '''
    mutation UpdateDriverLocation(\$latitude: Float!, \$longitude: Float!) {
      updateDriverLocation(latitude: \$latitude, longitude: \$longitude) {
        pengemudiId
        latitudeTerkini
        longitudeTerkini
      }
    }
  ''';
  
  static Future<List<dynamic>> getAvailableOrders({int? limit}) async {
    try {
      final client = await GraphQLService.getClient();
      final result = await client.query(
        QueryOptions(
          document: gql(getAvailableOrdersQuery),
          variables: {'limit': limit},
        ),
      );
      
      if (result.hasException) {
        throw Exception(result.exception.toString());
      }
      
      return result.data!['getAvailableOrders'] ?? [];
    } catch (e) {
      throw Exception('Failed to load available orders: $e');
    }
  }
  
  static Future<List<dynamic>> getMyDeliveries({int? limit}) async {
    try {
      final client = await GraphQLService.getClient();
      final result = await client.query(
        QueryOptions(
          document: gql(getMyDeliveriesQuery),
          variables: {'limit': limit},
        ),
      );
      
      if (result.hasException) {
        throw Exception(result.exception.toString());
      }
      
      return result.data!['getMyDeliveries'] ?? [];
    } catch (e) {
      throw Exception('Failed to load my deliveries: $e');
    }
  }
  
  static Future<Map<String, dynamic>?> acceptDelivery(String orderId) async {
    try {
      final client = await GraphQLService.getClient();
      final result = await client.mutate(
        MutationOptions(
          document: gql(acceptDeliveryMutation),
          variables: {'orderId': orderId},
        ),
      );
      
      if (result.hasException) {
        throw Exception(result.exception.toString());
      }
      
      return result.data!['acceptDelivery'];
    } catch (e) {
      throw Exception('Failed to accept delivery: $e');
    }
  }
  
  static Future<Map<String, dynamic>?> completeDelivery(String orderId) async {
    try {
      final client = await GraphQLService.getClient();
      final result = await client.mutate(
        MutationOptions(
          document: gql(completeDeliveryMutation),
          variables: {'orderId': orderId},
        ),
      );
      
      if (result.hasException) {
        throw Exception(result.exception.toString());
      }
      
      return result.data!['completeDelivery'];
    } catch (e) {
      throw Exception('Failed to complete delivery: $e');
    }
  }
  
  static Future<Map<String, dynamic>?> goOnline() async {
    try {
      final client = await GraphQLService.getClient();
      final result = await client.mutate(
        MutationOptions(document: gql(goOnlineMutation)),
      );
      
      if (result.hasException) {
        throw Exception(result.exception.toString());
      }
      
      return result.data!['goOnline'];
    } catch (e) {
      throw Exception('Failed to go online: $e');
    }
  }
  
  static Future<Map<String, dynamic>?> goOffline() async {
    try {
      final client = await GraphQLService.getClient();
      final result = await client.mutate(
        MutationOptions(document: gql(goOfflineMutation)),
      );
      
      if (result.hasException) {
        throw Exception(result.exception.toString());
      }
      
      return result.data!['goOffline'];
    } catch (e) {
      throw Exception('Failed to go offline: $e');
    }
  }
  
  static Future<Map<String, dynamic>?> updateLocation(double latitude, double longitude) async {
    try {
      final client = await GraphQLService.getClient();
      final result = await client.mutate(
        MutationOptions(
          document: gql(updateLocationMutation),
          variables: {
            'latitude': latitude,
            'longitude': longitude,
          },
        ),
      );
      
      if (result.hasException) {
        throw Exception(result.exception.toString());
      }
      
      return result.data!['updateDriverLocation'];
    } catch (e) {
      throw Exception('Failed to update location: $e');
    }
  }
}
```

---

## 🚗 Step 9: Driver Provider

Create `lib/providers/driver_provider.dart`:

```dart
import 'package:flutter/material.dart';
import '../services/driver_service.dart';

enum DriverStatus { Offline, Online, Delivering }

class DriverProvider with ChangeNotifier {
  DriverStatus _status = DriverStatus.Offline;
  List<dynamic> _availableOrders = [];
  List<dynamic> _myDeliveries = [];
  Map<String, dynamic>? _currentDelivery;
  bool _isLoading = false;
  double? _currentLatitude;
  double? _currentLongitude;
  
  DriverStatus get status => _status;
  List<dynamic> get availableOrders => _availableOrders;
  List<dynamic> get myDeliveries => _myDeliveries;
  Map<String, dynamic>? get currentDelivery => _currentDelivery;
  bool get isLoading => _isLoading;
  bool get isOnline => _status == DriverStatus.Online;
  bool get isDelivering => _status == DriverStatus.Delivering;
  double? get currentLatitude => _currentLatitude;
  double? get currentLongitude => _currentLongitude;
  
  Future<bool> goOnline() async {
    try {
      _isLoading = true;
      notifyListeners();
      
      final result = await DriverService.goOnline();
      if (result != null) {
        _status = DriverStatus.Online;
        await loadAvailableOrders();
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<bool> goOffline() async {
    try {
      _isLoading = true;
      notifyListeners();
      
      final result = await DriverService.goOffline();
      if (result != null) {
        _status = DriverStatus.Offline;
        _availableOrders.clear();
        _currentDelivery = null;
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> loadAvailableOrders() async {
    try {
      final orders = await DriverService.getAvailableOrders(limit: 20);
      _availableOrders = orders;
      notifyListeners();
    } catch (e) {
      print('Failed to load available orders: $e');
    }
  }
  
  Future<void> loadMyDeliveries() async {
    try {
      final deliveries = await DriverService.getMyDeliveries(limit: 10);
      _myDeliveries = deliveries;
      notifyListeners();
    } catch (e) {
      print('Failed to load my deliveries: $e');
    }
  }
  
  Future<bool> acceptDelivery(String orderId) async {
    try {
      _isLoading = true;
      notifyListeners();
      
      final result = await DriverService.acceptDelivery(orderId);
      if (result != null) {
        _status = DriverStatus.Delivering;
        _currentDelivery = result;
        
        _availableOrders.removeWhere((order) => order['pesananId'] == orderId);
        
        await loadMyDeliveries();
        
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<bool> completeDelivery(String orderId) async {
    try {
      _isLoading = true;
      notifyListeners();
      
      final result = await DriverService.completeDelivery(orderId);
      if (result != null) {
        _status = DriverStatus.Online;
        _currentDelivery = null;
        
        await loadAvailableOrders();
        await loadMyDeliveries();
        
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<bool> updateLocation(double latitude, double longitude) async {
    try {
      final result = await DriverService.updateLocation(latitude, longitude);
      if (result != null) {
        _currentLatitude = latitude;
        _currentLongitude = longitude;
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      print('Failed to update location: $e');
      return false;
    }
  }
  
  Future<void> refreshData() async {
    if (_status == DriverStatus.Online || _status == DriverStatus.Delivering) {
      await loadAvailableOrders();
    }
    await loadMyDeliveries();
  }
}
```

You're absolutely right! The guide was missing the driver service and provider. Now you have:

## 🏗️ **Complete Architecture** 