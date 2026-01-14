import { z } from "zod";

/**
 * Schema for creating an invoice via AI
 */
export const createInvoiceActionSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  amount: z.number().positive("Amount must be positive").optional(),
  vatRate: z.enum(["21", "9", "0"]).default("21"),
  dueInDays: z.number().int().positive().default(14),
  date: z.string().optional(), // ISO date string
  description: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    price: z.number().nonnegative(),
    unit: z.enum(["UUR", "STUK", "PROJECT", "KM", "LICENTIE", "STOP"]).default("UUR"),
    vatRate: z.enum(["21", "9", "0"]).default("21"),
  })).optional(),
});

/**
 * Schema for creating a quotation via AI
 */
export const createOfferteActionSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  amount: z.number().positive("Amount must be positive").optional(),
  vatRate: z.enum(["21", "9", "0"]).default("21"),
  validForDays: z.number().int().positive().default(30),
  date: z.string().optional(),
  description: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    price: z.number().nonnegative(),
    unit: z.enum(["UUR", "STUK", "PROJECT", "KM", "LICENTIE", "STOP"]).default("UUR"),
    vatRate: z.enum(["21", "9", "0"]).default("21"),
  })).optional(),
});

/**
 * Schema for querying invoices
 */
export const queryInvoicesActionSchema = z.object({
  status: z.enum(["CONCEPT", "VERZONDEN", "BETAALD", "HERINNERING"]).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  clientName: z.string().optional(),
  limit: z.number().int().positive().max(100).default(10),
});

/**
 * Schema for computing BTW/VAT summary
 */
export const computeBTWActionSchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  period: z.enum(["month", "quarter", "year"]).optional(),
});

/**
 * Schema for creating a client
 */
export const createClientActionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  kvkNumber: z.string().optional(),
  btwId: z.string().optional(),
});

export type CreateInvoiceAction = z.infer<typeof createInvoiceActionSchema>;
export type CreateOfferteAction = z.infer<typeof createOfferteActionSchema>;
export type QueryInvoicesAction = z.infer<typeof queryInvoicesActionSchema>;
export type ComputeBTWAction = z.infer<typeof computeBTWActionSchema>;
export type CreateClientAction = z.infer<typeof createClientActionSchema>;
/**
 * Schema for creating an expense via AI
 */
export const createExpenseActionSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be positive"),
  amountExcl: z.number().positive().optional(),
  vatRate: z.enum(["21", "9", "0"]).default("21"),
  date: z.string().optional(), // ISO date string
  description: z.string().optional(),
  vendor: z.string().optional(),
  paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "OTHER"]).optional(),
  receiptUrl: z.string().url().optional(),
});

export type CreateExpenseAction = z.infer<typeof createExpenseActionSchema>;
