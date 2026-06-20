import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config"; // Crucial: Loads variables before initialization

// 1. Setup connection pooling
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 2. Instantiate and export the single client instance
const prisma = new PrismaClient({ adapter });

export default prisma;
