    // File: src/graphql/schemas/restaurant.schema.js
    
    export const typeDefs = `#graphql
      # Mendefinisikan tipe data untuk Restaurant
      type Restaurant {
        restoranId: ID!
        nama: String!
        alamat: String
        jenisMasakan: String
        rating: Float
        jamBuka: String
        biayaAntar: Float
        # Kita juga bisa memasukkan relasi di sini
        menuItems: [MenuItem]
      }
      
      # Mendefinisikan tipe data untuk Menu Item
      type MenuItem {
        itemMenuId: ID!
        nama: String!
        deskripsi: String
        harga: Float!
      }
    
      # Menambahkan pertanyaan baru ke dalam Query
      extend type Query {
        getAllRestaurants: [Restaurant]
        getRestaurantById(id: ID!): Restaurant
      }
    
      # Menambahkan aksi baru ke dalam Mutation
      extend type Mutation {
        createRestaurant(nama: String!, alamat: String!): Restaurant
      }
    `;
    