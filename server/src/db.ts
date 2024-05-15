// server/src/db.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export default db;
