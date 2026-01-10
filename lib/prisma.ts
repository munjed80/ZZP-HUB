import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// SAFE START: Wrapped in try-catch to prevent fatal errors during initialization
// The PrismaClient is created but won't fail if DB is unreachable at module load time
let prismaInstance: PrismaClient;

try {
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaInstance;
  }
} catch (error) {
  console.error("[prisma] Error creating Prisma client:", error);
  // Create a fallback client that won't crash the app
  prismaInstance = new PrismaClient({
    log: ["error"],
  });
}

export const prisma = prismaInstance;
