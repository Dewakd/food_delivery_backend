    // File: src/graphql/resolvers/restaurant.resolver.js
    
    import { PrismaClient } from '@prisma/client';
    const prisma = new PrismaClient();

    export const resolvers = {
      Query: {
        getAllRestaurants: async () => {
          // Menggunakan Prisma untuk mengambil semua data dari tabel RESTAURANT
          return await prisma.rESTAURANT.findMany();
        },
        getRestaurantById: async (_, { id }) => {
          // Mengambil satu restoran berdasarkan ID.
          // parseInt(id) karena ID dari GraphQL adalah string.
          return await prisma.rESTAURANT.findUnique({
            where: { restoranId: parseInt(id) },
          });
        },
      },
      Mutation: {
        createRestaurant: async (_, { nama, alamat }) => {
          // Membuat entri baru di tabel RESTAURANT
          return await prisma.rESTAURANT.create({
            data: {
              nama: nama,
              alamat: alamat,
            },
          });
        },
      },
      // (Opsional) Resolver untuk relasi
      Restaurant: {
          menuItems: async (parent) => {
              // Ketika ada query yang meminta menuItems dari sebuah Restaurant,
              // jalankan kode ini untuk mengambil data menu item yang berelasi.
              return await prisma.mENU_ITEM.findMany({
                  where: { restoranId: parent.restoranId }
              });
          }
      }
    };
    