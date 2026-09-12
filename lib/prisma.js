const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;

function createPrisma() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }
  return new PrismaClient();
}

const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = prisma;
