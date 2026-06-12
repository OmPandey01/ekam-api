import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// 1. Create a native pg connection pool pointing to your DATABASE_URL environment variable
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// 2. Wrap it with the Prisma PostgreSQL adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the PrismaClient options
const prisma = new PrismaClient({ adapter });

export default prisma;
