/**
 * Tenant-safe Prisma wrapper
 * 
 * This module provides tenant-scoped database operations to ensure strict multi-tenant isolation.
 * All operations automatically inject companyId filtering to prevent cross-tenant data access.
 * 
 * SECURITY RULES:
 * 1. All tenant-bound operations MUST use these helpers
 * 2. companyId is derived from authenticated session, never from client input
 * 3. SUPERADMIN bypasses tenant filtering only in explicitly admin routes
 */

import { prisma } from "./prisma";
import { getServerAuthSession } from "./auth";
import { UserRole } from "@prisma/client";

/**
 * Gets the authenticated user's company ID from session
 * @throws Error if user is not authenticated or companyId is missing
 * @returns companyId for regular users, throws for SUPERADMIN without company
 */
export async function getSessionCompanyId(): Promise<string> {
  const session = await getServerAuthSession();
  
  if (!session?.user) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }
  
  if (session.user.isSuspended) {
    throw new Error("Dit account is geblokkeerd. Neem contact op met support.");
  }
  
  // Get user's companyId from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true, role: true },
  });
  
  if (!user) {
    throw new Error("Gebruiker niet gevonden.");
  }
  
  // SUPERADMIN may not have a company - this is an error for tenant operations
  if (!user.companyId) {
    if (user.role === UserRole.SUPERADMIN) {
      throw new Error("SUPERADMIN moet adminPrisma gebruiken voor cross-tenant queries.");
    }
    throw new Error("Geen bedrijf gekoppeld aan dit account. Neem contact op met support.");
  }
  
  return user.companyId;
}

/**
 * Gets tenant scope for queries
 * Returns empty object for SUPERADMIN, companyId filter for regular users
 */
export async function getTenantScope(): Promise<{ companyId?: string }> {
  const session = await getServerAuthSession();
  
  if (!session?.user) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }
  
  if (session.user.role === UserRole.SUPERADMIN) {
    return {}; // SUPERADMIN sees all data
  }
  
  const companyId = await getSessionCompanyId();
  return { companyId };
}

/**
 * Pagination defaults
 */
export const PAGINATION_DEFAULTS = {
  DEFAULT_LIMIT: 25,
  MAX_LIMIT: 100,
} as const;

/**
 * Apply pagination with safety limits
 */
export function applyPagination(params?: { take?: number; skip?: number }) {
  const take = Math.min(
    params?.take ?? PAGINATION_DEFAULTS.DEFAULT_LIMIT,
    PAGINATION_DEFAULTS.MAX_LIMIT
  );
  const skip = params?.skip ?? 0;
  
  return { take, skip };
}

/**
 * Tenant-safe wrapper for Prisma client operations
 */
export const tenantPrisma = {
  /**
   * Invoice operations
   */
  invoice: {
    async findMany(args?: Parameters<typeof prisma.invoice.findMany>[0]) {
      const scope = await getTenantScope();
      const pagination = applyPagination(args);
      
      return prisma.invoice.findMany({
        ...args,
        where: {
          ...scope,
          ...args?.where,
        },
        take: args?.take ?? pagination.take,
        skip: args?.skip ?? pagination.skip,
        orderBy: args?.orderBy ?? { createdAt: "desc" },
      });
    },

    async findUnique(args: Parameters<typeof prisma.invoice.findUnique>[0]) {
      const scope = await getTenantScope();
      
      // Note: Using findFirst instead of findUnique because we need to add companyId filter
      // Prisma's findUnique only works with unique constraints, and we're adding a filter
      return prisma.invoice.findFirst({
        ...args,
        where: {
          ...scope,
          ...args.where,
        },
      });
    },

    async create(args: Parameters<typeof prisma.invoice.create>[0]) {
      const companyId = await getSessionCompanyId();
      
      return prisma.invoice.create({
        ...args,
        data: {
          ...args.data,
          companyId,
        },
      });
    },

    async update(args: Parameters<typeof prisma.invoice.update>[0]) {
      const scope = await getTenantScope();
      
      // First verify the record belongs to the tenant
      const existing = await prisma.invoice.findFirst({
        where: {
          ...scope,
          id: args.where.id,
        },
      });
      
      if (!existing) {
        throw new Error("Factuur niet gevonden.");
      }
      
      return prisma.invoice.update(args);
    },

    async delete(args: Parameters<typeof prisma.invoice.delete>[0]) {
      const scope = await getTenantScope();
      
      // First verify the record belongs to the tenant
      const existing = await prisma.invoice.findFirst({
        where: {
          ...scope,
          id: args.where.id,
        },
      });
      
      if (!existing) {
        throw new Error("Factuur niet gevonden.");
      }
      
      return prisma.invoice.delete(args);
    },

    async count(args?: Parameters<typeof prisma.invoice.count>[0]) {
      const scope = await getTenantScope();
      
      return prisma.invoice.count({
        ...args,
        where: {
          ...scope,
          ...args?.where,
        },
      });
    },
  },

  /**
   * Client operations
   */
  client: {
    async findMany(args?: Parameters<typeof prisma.client.findMany>[0]) {
      const scope = await getTenantScope();
      const pagination = applyPagination(args);
      
      return prisma.client.findMany({
        ...args,
        where: {
          ...scope,
          ...args?.where,
        },
        take: args?.take ?? pagination.take,
        skip: args?.skip ?? pagination.skip,
        orderBy: args?.orderBy ?? { createdAt: "desc" },
      });
    },

    async findUnique(args: Parameters<typeof prisma.client.findUnique>[0]) {
      const scope = await getTenantScope();
      
      return prisma.client.findFirst({
        ...args,
        where: {
          ...scope,
          ...args.where,
        },
      });
    },

    async create(args: Parameters<typeof prisma.client.create>[0]) {
      const companyId = await getSessionCompanyId();
      
      return prisma.client.create({
        ...args,
        data: {
          ...args.data,
          companyId,
        },
      });
    },

    async update(args: Parameters<typeof prisma.client.update>[0]) {
      const scope = await getTenantScope();
      
      const existing = await prisma.client.findFirst({
        where: {
          ...scope,
          id: args.where.id,
        },
      });
      
      if (!existing) {
        throw new Error("Relatie niet gevonden.");
      }
      
      return prisma.client.update(args);
    },

    async delete(args: Parameters<typeof prisma.client.delete>[0]) {
      const scope = await getTenantScope();
      
      const existing = await prisma.client.findFirst({
        where: {
          ...scope,
          id: args.where.id,
        },
      });
      
      if (!existing) {
        throw new Error("Relatie niet gevonden.");
      }
      
      return prisma.client.delete(args);
    },

    async deleteMany(args: Parameters<typeof prisma.client.deleteMany>[0]) {
      const scope = await getTenantScope();
      
      return prisma.client.deleteMany({
        ...args,
        where: {
          ...scope,
          ...args.where,
        },
      });
    },

    async updateMany(args: Parameters<typeof prisma.client.updateMany>[0]) {
      const scope = await getTenantScope();
      
      return prisma.client.updateMany({
        ...args,
        where: {
          ...scope,
          ...args.where,
        },
      });
    },
  },

  /**
   * Expense operations
   */
  expense: {
    async findMany(args?: Parameters<typeof prisma.expense.findMany>[0]) {
      const scope = await getTenantScope();
      const pagination = applyPagination(args);
      
      return prisma.expense.findMany({
        ...args,
        where: {
          ...scope,
          ...args?.where,
        },
        take: args?.take ?? pagination.take,
        skip: args?.skip ?? pagination.skip,
        orderBy: args?.orderBy ?? { createdAt: "desc" },
      });
    },

    async findUnique(args: Parameters<typeof prisma.expense.findUnique>[0]) {
      const scope = await getTenantScope();
      
      return prisma.expense.findFirst({
        ...args,
        where: {
          ...scope,
          ...args.where,
        },
      });
    },

    async create(args: Parameters<typeof prisma.expense.create>[0]) {
      const companyId = await getSessionCompanyId();
      
      return prisma.expense.create({
        ...args,
        data: {
          ...args.data,
          companyId,
        },
      });
    },

    async update(args: Parameters<typeof prisma.expense.update>[0]) {
      const scope = await getTenantScope();
      
      const existing = await prisma.expense.findFirst({
        where: {
          ...scope,
          id: args.where.id,
        },
      });
      
      if (!existing) {
        throw new Error("Uitgave niet gevonden.");
      }
      
      return prisma.expense.update(args);
    },

    async delete(args: Parameters<typeof prisma.expense.delete>[0]) {
      const scope = await getTenantScope();
      
      const existing = await prisma.expense.findFirst({
        where: {
          ...scope,
          id: args.where.id,
        },
      });
      
      if (!existing) {
        throw new Error("Uitgave niet gevonden.");
      }
      
      return prisma.expense.delete(args);
    },

    async deleteMany(args: Parameters<typeof prisma.expense.deleteMany>[0]) {
      const scope = await getTenantScope();
      
      return prisma.expense.deleteMany({
        ...args,
        where: {
          ...scope,
          ...args.where,
        },
      });
    },
  },

  /**
   * Quotation operations
   */
  quotation: {
    async findMany(args?: Parameters<typeof prisma.quotation.findMany>[0]) {
      const scope = await getTenantScope();
      const pagination = applyPagination(args);
      
      return prisma.quotation.findMany({
        ...args,
        where: {
          ...scope,
          ...args?.where,
        },
        take: args?.take ?? pagination.take,
        skip: args?.skip ?? pagination.skip,
        orderBy: args?.orderBy ?? { createdAt: "desc" },
      });
    },

    async findUnique(args: Parameters<typeof prisma.quotation.findUnique>[0]) {
      const scope = await getTenantScope();
      
      return prisma.quotation.findFirst({
        ...args,
        where: {
          ...scope,
          ...args.where,
        },
      });
    },

    async create(args: Parameters<typeof prisma.quotation.create>[0]) {
      const companyId = await getSessionCompanyId();
      
      return prisma.quotation.create({
        ...args,
        data: {
          ...args.data,
          companyId,
        },
      });
    },

    async update(args: Parameters<typeof prisma.quotation.update>[0]) {
      const scope = await getTenantScope();
      
      const existing = await prisma.quotation.findFirst({
        where: {
          ...scope,
          id: args.where.id,
        },
      });
      
      if (!existing) {
        throw new Error("Offerte niet gevonden.");
      }
      
      return prisma.quotation.update(args);
    },

    async delete(args: Parameters<typeof prisma.quotation.delete>[0]) {
      const scope = await getTenantScope();
      
      const existing = await prisma.quotation.findFirst({
        where: {
          ...scope,
          id: args.where.id,
        },
      });
      
      if (!existing) {
        throw new Error("Offerte niet gevonden.");
      }
      
      return prisma.quotation.delete(args);
    },
  },

  /**
   * TimeEntry operations
   */
  timeEntry: {
    async findMany(args?: Parameters<typeof prisma.timeEntry.findMany>[0]) {
      const scope = await getTenantScope();
      const pagination = applyPagination(args);
      
      return prisma.timeEntry.findMany({
        ...args,
        where: {
          ...scope,
          ...args?.where,
        },
        take: args?.take ?? pagination.take,
        skip: args?.skip ?? pagination.skip,
        orderBy: args?.orderBy ?? { createdAt: "desc" },
      });
    },

    async create(args: Parameters<typeof prisma.timeEntry.create>[0]) {
      const companyId = await getSessionCompanyId();
      
      return prisma.timeEntry.create({
        ...args,
        data: {
          ...args.data,
          companyId,
        },
      });
    },

    async delete(args: Parameters<typeof prisma.timeEntry.delete>[0]) {
      const scope = await getTenantScope();
      
      const existing = await prisma.timeEntry.findFirst({
        where: {
          ...scope,
          id: args.where.id,
        },
      });
      
      if (!existing) {
        throw new Error("Uren registratie niet gevonden.");
      }
      
      return prisma.timeEntry.delete(args);
    },

    async deleteMany(args: Parameters<typeof prisma.timeEntry.deleteMany>[0]) {
      const scope = await getTenantScope();
      
      return prisma.timeEntry.deleteMany({
        ...args,
        where: {
          ...scope,
          ...args.where,
        },
      });
    },
  },

  /**
   * Event operations
   */
  event: {
    async findMany(args?: Parameters<typeof prisma.event.findMany>[0]) {
      const scope = await getTenantScope();
      const pagination = applyPagination(args);
      
      return prisma.event.findMany({
        ...args,
        where: {
          ...scope,
          ...args?.where,
        },
        take: args?.take ?? pagination.take,
        skip: args?.skip ?? pagination.skip,
        orderBy: args?.orderBy ?? { start: "desc" },
      });
    },

    async create(args: Parameters<typeof prisma.event.create>[0]) {
      const companyId = await getSessionCompanyId();
      
      return prisma.event.create({
        ...args,
        data: {
          ...args.data,
          companyId,
        },
      });
    },

    async update(args: Parameters<typeof prisma.event.update>[0]) {
      const scope = await getTenantScope();
      
      const existing = await prisma.event.findFirst({
        where: {
          ...scope,
          id: args.where.id,
        },
      });
      
      if (!existing) {
        throw new Error("Afspraak niet gevonden.");
      }
      
      return prisma.event.update(args);
    },

    async delete(args: Parameters<typeof prisma.event.delete>[0]) {
      const scope = await getTenantScope();
      
      const existing = await prisma.event.findFirst({
        where: {
          ...scope,
          id: args.where.id,
        },
      });
      
      if (!existing) {
        throw new Error("Afspraak niet gevonden.");
      }
      
      return prisma.event.delete(args);
    },

    async deleteMany(args: Parameters<typeof prisma.event.deleteMany>[0]) {
      const scope = await getTenantScope();
      
      return prisma.event.deleteMany({
        ...args,
        where: {
          ...scope,
          ...args.where,
        },
      });
    },
  },
};

/**
 * For SUPERADMIN admin routes only - allows cross-tenant queries with mandatory pagination
 */
export const adminPrisma = {
  /**
   * Get all companies with pagination
   */
  async getCompanies(params?: { take?: number; skip?: number }) {
    const session = await getServerAuthSession();
    
    if (session?.user?.role !== UserRole.SUPERADMIN) {
      throw new Error("Alleen SUPERADMIN heeft toegang tot deze functie.");
    }
    
    const pagination = applyPagination(params);
    
    return prisma.company.findMany({
      ...pagination,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            users: true,
            invoices: true,
            clients: true,
          },
        },
      },
    });
  },

  /**
   * Get all invoices across tenants with mandatory pagination (admin only)
   */
  async getAllInvoices(params?: { take?: number; skip?: number; companyId?: string }) {
    const session = await getServerAuthSession();
    
    if (session?.user?.role !== UserRole.SUPERADMIN) {
      throw new Error("Alleen SUPERADMIN heeft toegang tot deze functie.");
    }
    
    const pagination = applyPagination(params);
    
    return prisma.invoice.findMany({
      where: params?.companyId ? { companyId: params.companyId } : undefined,
      ...pagination,
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        company: { select: { name: true, id: true } },
      },
    });
  },
};
