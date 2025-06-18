// File: src/index.js (ESM Version - Final Check, Explicit Middleware)

import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import http from 'http';
import cors from 'cors';

// Mengimpor dari file penggabungan (_index.js) kita
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

  // --- PERUBAHAN UTAMA DI SINI ---
  // Menerapkan middleware global SEBELUM middleware Apollo
  // 1. Terapkan cors() ke semua request
  app.use(cors());

  // 2. Terapkan express.json() ke semua request untuk parsing body
  app.use(express.json());

  // 3. SEKARANG, terapkan middleware Apollo ke endpoint spesifik '/graphql'
  //    Karena middleware global sudah berjalan, req.body pasti sudah ada.
  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => {
      // Extract token from Authorization header
      const token = req.headers.authorization;
      
      // Get user from token (if exists)
      const user = getUserFromToken(token);
      
      return {
        user // This will be available in all resolvers as context.user
      };
    }
  }));


  const PORT = 4000;
  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
  console.log(`🚀 Server siap di http://localhost:${PORT}/graphql`);
}

// Memanggil fungsi untuk memulai seluruh proses
startServer();
