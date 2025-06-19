import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import http from 'http';
import cors from 'cors';

import { typeDefs } from './graphql/schemas/_index.js';
import { resolvers } from './graphql/resolvers/_index.js';
import { getUserFromToken } from './utils/auth.js';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(cors());
  app.use(express.json());

  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => {
      const token = req.headers.authorization;
      const user = getUserFromToken(token);
      
      return {
        user
      };
    }
  }));


  const PORT = 4000;
  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
  console.log(`🚀 Server siap di http://localhost:${PORT}/graphql`);
}

startServer();
