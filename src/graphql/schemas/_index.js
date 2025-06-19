import { typeDefs as userTypeDefs } from './user.schema.js';
import { typeDefs as restaurantTypeDefs } from './restaurant.schema.js';
import { typeDefs as deliveryDriverTypeDefs } from './deliveryDriver.schema.js';
import { typeDefs as orderTypeDefs } from './order.schema.js';
import { typeDefs as orderItemTypeDefs } from './orderItem.schema.js';
import { typeDefs as cartTypeDefs } from './cart.schema.js';

const baseTypeDefs = `#graphql
  type Query
  type Mutation
`;

export const typeDefs = [baseTypeDefs, userTypeDefs, restaurantTypeDefs, deliveryDriverTypeDefs, orderTypeDefs, orderItemTypeDefs, cartTypeDefs];