import { z } from "zod";

/**
 * Draft schemas for AI-assisted entity creation
 * These are used for multi-step data collection and validation
 */

// Base line item schema for invoices and quotes
export const LineItemDraftSchema = z.object({
  description: z.string().min(1, "Beschrijving is verplicht"),
  quantity: z.number().positive("Aantal moet positief zijn"),
  price: z.number().nonnegative("Prijs kan niet negatief zijn"),
  unit: z.enum(["UUR", "STUK", "PROJECT", "KM", "LICENTIE", "STOP", "SERVICE"]).default("STUK"),
  vatRate: z.enum(["21", "9", "0"]).default("21"),
});

/**
 * Client Draft Schema
 * For creating new clients/relations via AI
 */
export const ClientDraftSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  email: z.string().email("Geldig e-mailadres vereist").optional(),
  kvkNumber: z.string().optional(),
  btwId: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
});

/**
 * Invoice Draft Schema
 * For creating invoices via AI with step-by-step collection
 */
export const InvoiceDraftSchema = z.object({
  // Required fields
  clientId: z.string().optional(), // If known
  clientName: z.string().min(1, "Klantnaam is verplicht"),
  
  // Line items OR single amount
  items: z.array(LineItemDraftSchema).optional(),
  amount: z.number().positive().optional(),
  
  // Dates
  issueDate: z.string().optional(), // ISO date
  dueDate: z.string().optional(), // ISO date
  dueInDays: z.number().int().positive().default(14),
  
  // VAT and other
  vatRate: z.enum(["21", "9", "0"]).default("21"),
  discount: z.number().min(0).max(100).optional(), // Percentage
  notes: z.string().optional(),
  currency: z.enum(["EUR"]).default("EUR"),
}).refine(
  (data) => data.items || data.amount,
  {
    message: "Specificeer items of een bedrag",
    path: ["items"],
  }
);

/**
 * Quotation/Offerte Draft Schema
 */
export const OfferteDraftSchema = z.object({
  // Required fields
  clientId: z.string().optional(),
  clientName: z.string().min(1, "Klantnaam is verplicht"),
  
  // Line items OR single amount
  items: z.array(LineItemDraftSchema).optional(),
  amount: z.number().positive().optional(),
  
  // Dates
  issueDate: z.string().optional(),
  validUntilDate: z.string().optional(),
  validForDays: z.number().int().positive().default(30),
  
  // VAT and other
  vatRate: z.enum(["21", "9", "0"]).default("21"),
  discount: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  currency: z.enum(["EUR"]).default("EUR"),
}).refine(
  (data) => data.items || data.amount,
  {
    message: "Specificeer items of een bedrag",
    path: ["items"],
  }
);

/**
 * Expense Draft Schema
 */
export const ExpenseDraftSchema = z.object({
  vendor: z.string().optional(),
  category: z.string().min(1, "Categorie is verplicht"),
  amount: z.number().positive("Bedrag moet positief zijn"),
  amountExcl: z.number().positive().optional(), // Excl. VAT
  vatRate: z.enum(["21", "9", "0"]).default("21"),
  date: z.string().optional(), // ISO date
  description: z.string().optional(),
  paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "OTHER"]).optional(),
  receiptUrl: z.string().url().optional(),
});

/**
 * Intent Classification Schema
 * Ensures strict validation of intent detection results
 */
export const IntentSchema = z.object({
  intent: z.enum([
    "help_question",
    "create_factuur",
    "create_offerte",
    "create_uitgave",
    "create_client",
    "query_invoices",
    "query_expenses",
    "compute_btw",
    "update_settings",
    "unknown",
  ]),
  confidence: z.number().min(0).max(1).default(1.0),
  entities: z.record(z.unknown()).optional(),
});

/**
 * Preview/Confirmation Schema
 */
export const PreviewSchema = z.object({
  type: z.enum(["invoice", "offerte", "expense", "client"]),
  data: z.record(z.unknown()),
  needsConfirmation: z.boolean().default(true),
  actions: z.array(z.object({
    label: z.string(),
    action: z.enum(["confirm", "edit", "cancel", "add_item"]),
  })).optional(),
});

/**
 * Conversation State Schema
 */
export const ConversationStateSchema = z.object({
  conversationId: z.string(),
  userId: z.string(),
  intent: z.string(),
  draft: z.record(z.unknown()),
  status: z.enum(["collecting", "validating", "previewing", "confirmed", "cancelled"]),
  missingFields: z.array(z.string()).optional(),
  validationErrors: z.array(z.string()).optional(),
  lastUpdated: z.string().optional(), // ISO timestamp
});

// Export inferred types
export type ClientDraft = z.infer<typeof ClientDraftSchema>;
export type InvoiceDraft = z.infer<typeof InvoiceDraftSchema>;
export type OfferteDraft = z.infer<typeof OfferteDraftSchema>;
export type ExpenseDraft = z.infer<typeof ExpenseDraftSchema>;
export type LineItemDraft = z.infer<typeof LineItemDraftSchema>;
export type Intent = z.infer<typeof IntentSchema>;
export type Preview = z.infer<typeof PreviewSchema>;
export type ConversationState = z.infer<typeof ConversationStateSchema>;
