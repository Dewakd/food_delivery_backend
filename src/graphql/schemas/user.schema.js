    // File: src/graphql/schemas/user.schema.js
    
    export const typeDefs = `#graphql
      # Enum Role harus didefinisikan juga di GraphQL
      enum Role {
        Customer
        Driver
        Restaurant
      }
    
  type User {
    penggunaId: ID!
    email: String!
    namaPengguna: String
    role: Role!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # Menambahkan pertanyaan ke dalam Query
  extend type Query {
    getAllUsers: [User]
    me: User
  }

  # Menambahkan aksi ke dalam Mutation
  extend type Mutation {
    registerUser(email: String!, namaPengguna: String, password: String!, role: Role!): AuthPayload
    loginUser(email: String!, password: String!): AuthPayload
  }
    `;
    