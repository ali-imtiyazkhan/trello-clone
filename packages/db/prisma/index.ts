import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

export const prisma = new PrismaClient({ adapter });

export type { PrismaClient } from "./generated/prisma/client.js";
export type { Prisma } from "./generated/prisma/client.js";