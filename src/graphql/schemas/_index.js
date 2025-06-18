    // File: src/graphql/schemas/_index.js
    
    // Menggunakan import. Kita harus menyertakan ekstensi .js
import { typeDefs as userTypeDefs } from './user.schema.js';
import { typeDefs as restaurantTypeDefs } from './restaurant.schema.js';
import { typeDefs as deliveryDriverTypeDefs } from './deliveryDriver.schema.js';

const baseTypeDefs = `#graphql
  type Query
  type Mutation
`;

export const typeDefs = [baseTypeDefs, userTypeDefs, restaurantTypeDefs, deliveryDriverTypeDefs];