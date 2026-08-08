import { PrismaClient } from '@prisma/client';
import * as jsonStorage from './jsonStorage';

declare global {
  // eslint-disable-next-line no-var
  var globalPrisma: PrismaClient | undefined;
}

export let prisma: PrismaClient;

let isPostgresAvailable = false;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!globalThis.globalPrisma) {
    globalThis.globalPrisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prisma = globalThis.globalPrisma;
}

/**
 * Check if PostgreSQL database is reachable.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    if (!process.env.DATABASE_URL) {
      isPostgresAvailable = false;
      return false;
    }
    await prisma.$queryRaw`SELECT 1`;
    isPostgresAvailable = true;
    return true;
  } catch (err) {
    isPostgresAvailable = false;
    console.info('[PrismaClient] PostgreSQL database connection unavailable. Operating on local JSON storage fallback.');
    return false;
  }
}

export function isDbConnected(): boolean {
  return isPostgresAvailable;
}

export { jsonStorage };
