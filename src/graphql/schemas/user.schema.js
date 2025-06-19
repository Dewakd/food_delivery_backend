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
    telepon: String
    alamat: String
    role: Role!
    createdAt: String
    updatedAt: String
    # Relasi
    restaurants: [Restaurant]
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input UpdateProfileInput {
    namaPengguna: String
    telepon: String
    alamat: String
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  # Menambahkan pertanyaan ke dalam Query
  extend type Query {
    getAllUsers: [User]
    me: User
    getUserById(id: ID!): User
    getUsersByRole(role: Role!): [User]
    searchUsers(searchTerm: String!): [User]
  }

  # Menambahkan aksi ke dalam Mutation
  extend type Mutation {
    registerUser(email: String!, namaPengguna: String, password: String!, role: Role!, telepon: String, alamat: String): AuthPayload
    loginUser(email: String!, password: String!): AuthPayload
    updateProfile(input: UpdateProfileInput!): User
    changePassword(input: ChangePasswordInput!): Boolean
    deleteUser(id: ID!): Boolean
    updateUserRole(id: ID!, role: Role!): User
  }
    `;
    