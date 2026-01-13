import { findRelevantSections, buildContextString } from "./knowledge-loader";
import {
  createInvoiceActionSchema,
  createOfferteActionSchema,
  queryInvoicesActionSchema,
  computeBTWActionSchema,
  createClientActionSchema,
} from "../schemas/actions";
import { toolCreateInvoiceDraft, toolCreateInvoiceFinal } from "../tools/invoice-tools";
import { toolCreateOfferteDraft } from "../tools/offerte-tools";
import { toolGetClientByName, toolCreateClientIfMissing } from "../tools/client-tools";
import { toolListInvoices, toolComputeBTW } from "../tools/query-tools";
import { prisma } from "@/lib/prisma";

interface RouterContext {
  userId: string;
}

export type IntentType = "question" | "action" | "unknown";

export interface RouterResult {
  intent: IntentType;
  type?: "answer" | "create_invoice" | "create_offerte" | "query_invoices" | "compute_btw" | "create_client";
  data?: any;
  message?: string;
  needsConfirmation?: boolean;
  needsMoreInfo?: boolean;
  missingFields?: string[];
  citations?: string[];
}

/**
 * Detect intent from user message
 */
function detectIntent(message: string): { intent: IntentType; actionType?: string } {
  const normalized = message.toLowerCase();

  // Action keywords
  const createInvoiceKeywords = ["maak", "create", "genereer", "factuur", "invoice"];
  const createOfferteKeywords = ["offerte", "quotation", "quote", "aanbieding"];
  const queryKeywords = ["toon", "laat zien", "show", "list", "hoeveel", "welke", "wat"];
  const btwKeywords = ["btw", "vat", "belasting", "verschuldigd"];

  // Check for create invoice
  if (createInvoiceKeywords.some((kw) => normalized.includes(kw)) && 
      !createOfferteKeywords.some((kw) => normalized.includes(kw))) {
    return { intent: "action", actionType: "create_invoice" };
  }

  // Check for create offerte
  if (createOfferteKeywords.some((kw) => normalized.includes(kw))) {
    return { intent: "action", actionType: "create_offerte" };
  }

  // Check for query
  if (queryKeywords.some((kw) => normalized.includes(kw))) {
    if (btwKeywords.some((kw) => normalized.includes(kw))) {
      return { intent: "action", actionType: "compute_btw" };
    }
    return { intent: "action", actionType: "query_invoices" };
  }

  // Default to question
  return { intent: "question" };
}

/**
 * Extract action parameters from message using simple pattern matching
 */
function extractInvoiceParams(message: string): any {
  const normalized = message.toLowerCase();
  const params: any = {};

  // Extract client name (after "voor" or "for")
  const clientMatch = message.match(/(?:voor|for)\s+([A-Za-z\s]+?)(?:\s*,|\s+bedrag|\s+amount|\s+€|\s+\d|$)/i);
  if (clientMatch) {
    params.clientName = clientMatch[1].trim();
  }

  // Extract amount
  const amountMatch = message.match(/(?:bedrag|amount|€)\s*(\d+(?:[.,]\d+)?)/i);
  if (amountMatch) {
    params.amount = parseFloat(amountMatch[1].replace(",", "."));
  }

  // Extract VAT rate
  if (normalized.includes("21%") || normalized.includes("21 %")) {
    params.vatRate = "21";
  } else if (normalized.includes("9%") || normalized.includes("9 %")) {
    params.vatRate = "9";
  } else if (normalized.includes("0%") || normalized.includes("0 %")) {
    params.vatRate = "0";
  }

  // Extract due days
  const dueMatch = message.match(/(?:binnen|in|due)\s+(\d+)\s+(?:dagen|days)/i);
  if (dueMatch) {
    params.dueInDays = parseInt(dueMatch[1]);
  }

  // Extract description
  const descMatch = message.match(/(?:voor|omschrijving|description):\s*([^,.\n]+)/i);
  if (descMatch) {
    params.description = descMatch[1].trim();
  }

  return params;
}

/**
 * Answer question using product knowledge
 */
async function handleQuestion(message: string, context: RouterContext): Promise<RouterResult> {
  const sections = await findRelevantSections(message, 3);
  
  if (sections.length === 0) {
    return {
      intent: "question",
      type: "answer",
      data: {
        answer: "Sorry, ik kon geen relevante informatie vinden over je vraag. Probeer het anders te formuleren of neem contact op met support.",
      },
    };
  }

  const contextStr = buildContextString(sections);
  const citations = sections.map((s) => `${s.file}: ${s.heading}`);

  // Simple answer construction
  const answer = `${contextStr}\n\n*Bron: ${citations.join(", ")}*`;

  return {
    intent: "question",
    type: "answer",
    data: { answer, sections },
    citations,
  };
}

/**
 * Handle create invoice action
 */
async function handleCreateInvoice(message: string, context: RouterContext): Promise<RouterResult> {
  const params = extractInvoiceParams(message);

  // Check for missing required fields
  const missing: string[] = [];
  if (!params.clientName) missing.push("clientName");
  if (!params.amount && !params.items) missing.push("amount or items");

  if (missing.length > 0) {
    return {
      intent: "action",
      type: "create_invoice",
      needsMoreInfo: true,
      missingFields: missing,
      message: `Om een factuur aan te maken heb ik de volgende informatie nodig: ${missing.join(", ")}. Kun je deze gegevens verstrekken?`,
    };
  }

  // Validate with schema
  try {
    const validated = createInvoiceActionSchema.parse(params);
    const result = await toolCreateInvoiceDraft(validated, context);

    return {
      intent: "action",
      type: "create_invoice",
      data: result,
      needsConfirmation: result.success,
      message: result.message,
    };
  } catch (error: any) {
    return {
      intent: "action",
      type: "create_invoice",
      data: { success: false, error: error.message },
      message: `Fout bij validatie: ${error.message}`,
    };
  }
}

/**
 * Handle create offerte action
 */
async function handleCreateOfferte(message: string, context: RouterContext): Promise<RouterResult> {
  const params = extractInvoiceParams(message);

  const missing: string[] = [];
  if (!params.clientName) missing.push("clientName");
  if (!params.amount && !params.items) missing.push("amount or items");

  if (missing.length > 0) {
    return {
      intent: "action",
      type: "create_offerte",
      needsMoreInfo: true,
      missingFields: missing,
      message: `Om een offerte aan te maken heb ik: ${missing.join(", ")}`,
    };
  }

  try {
    const validated = createOfferteActionSchema.parse(params);
    const result = await toolCreateOfferteDraft(validated, context);

    return {
      intent: "action",
      type: "create_offerte",
      data: result,
      needsConfirmation: result.success,
      message: result.message,
    };
  } catch (error: any) {
    return {
      intent: "action",
      type: "create_offerte",
      data: { success: false, error: error.message },
      message: `Fout: ${error.message}`,
    };
  }
}

/**
 * Handle query invoices
 */
async function handleQueryInvoices(message: string, context: RouterContext): Promise<RouterResult> {
  const normalized = message.toLowerCase();
  const params: any = { limit: 10 };

  // Extract status
  if (normalized.includes("onbetaald") || normalized.includes("unpaid")) {
    params.status = "VERZONDEN";
  } else if (normalized.includes("betaald") || normalized.includes("paid")) {
    params.status = "BETAALD";
  } else if (normalized.includes("concept") || normalized.includes("draft")) {
    params.status = "CONCEPT";
  }

  // Extract time period
  if (normalized.includes("deze maand") || normalized.includes("this month")) {
    const now = new Date();
    params.fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    params.toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
  }

  const validated = queryInvoicesActionSchema.parse(params);
  const result = await toolListInvoices(validated, context);

  return {
    intent: "action",
    type: "query_invoices",
    data: result,
    message: `${result.count} facturen gevonden.`,
  };
}

/**
 * Handle BTW computation
 */
async function handleComputeBTW(message: string, context: RouterContext): Promise<RouterResult> {
  const normalized = message.toLowerCase();
  const params: any = {};

  if (normalized.includes("deze maand") || normalized.includes("this month")) {
    params.period = "month";
  } else if (normalized.includes("kwartaal") || normalized.includes("quarter")) {
    params.period = "quarter";
  } else if (normalized.includes("jaar") || normalized.includes("year")) {
    params.period = "year";
  } else {
    params.period = "quarter"; // default
  }

  const validated = computeBTWActionSchema.parse(params);
  const result = await toolComputeBTW(validated, context);

  return {
    intent: "action",
    type: "compute_btw",
    data: result,
    message: result.summary,
  };
}

/**
 * Main router function
 */
export async function routeAIRequest(
  message: string,
  context: RouterContext
): Promise<RouterResult> {
  const { intent, actionType } = detectIntent(message);

  if (intent === "question") {
    return handleQuestion(message, context);
  }

  if (intent === "action") {
    switch (actionType) {
      case "create_invoice":
        return handleCreateInvoice(message, context);
      case "create_offerte":
        return handleCreateOfferte(message, context);
      case "query_invoices":
        return handleQueryInvoices(message, context);
      case "compute_btw":
        return handleComputeBTW(message, context);
      default:
        return {
          intent: "unknown",
          message: "Sorry, ik begrijp deze actie niet. Probeer het anders te formuleren.",
        };
    }
  }

  return {
    intent: "unknown",
    message: "Sorry, ik begrijp je vraag niet. Kun je het anders formuleren?",
  };
}
