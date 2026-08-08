import * as jsonStorage from './jsonStorage';

// Defensive import for PrismaClient to ensure build succeeds even if @prisma/client is not pre-generated
let PrismaClientClass: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const prismaModule = require('@prisma/client');
  PrismaClientClass = prismaModule.PrismaClient;
} catch {
  PrismaClientClass = null;
}

export let prisma: any = null;

if (PrismaClientClass) {
  try {
    prisma = new PrismaClientClass({
      log: ['error', 'warn'],
    });
  } catch {
    prisma = null;
  }
}

/**
 * Check if PostgreSQL database is reachable.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    if (!prisma || !process.env.DATABASE_URL) {
      return false;
    }
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    console.info('[PrismaClient] Operating on local JSON storage fallback.');
    return false;
  }
}

export function isDbConnected(): boolean {
  return Boolean(prisma);
}

export { jsonStorage };
