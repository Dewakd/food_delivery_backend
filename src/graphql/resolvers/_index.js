import { resolvers as userResolvers } from './user.resolver.js';
import { resolvers as restaurantResolvers } from './restaurant.resolver.js';
import { resolvers as deliveryDriverResolvers } from './deliveryDriver.resolver.js';
import { resolvers as orderResolvers } from './order.resolver.js';
import { resolvers as orderItemResolvers } from './orderItem.resolver.js';
import { resolvers as cartResolvers } from './cart.resolver.js';

import lodash from 'lodash';

export const resolvers = lodash.merge(userResolvers, restaurantResolvers, deliveryDriverResolvers, orderResolvers, orderItemResolvers, cartResolvers);
    