const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;

// Only initialize Prisma on the server side (where DATABASE_URL is available).
// On the client side, getServerSideProps imports are tree-shaken, but the
// module still evaluates — return a harmless proxy instead of throwing.
function createPrisma() {
  if (typeof window !== 'undefined') {
    // Client-side: return a proxy that throws on use (should never be called)
    return new Proxy({}, { get() { throw new Error('Prisma is server-only.'); } });
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }
  return new PrismaClient();
}

const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== 'production' && typeof window === 'undefined') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
