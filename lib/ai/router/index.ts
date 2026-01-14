import { findRelevantSections, buildContextString } from "./knowledge-loader";
import {
  createInvoiceActionSchema,
  createOfferteActionSchema,
  createExpenseActionSchema,
  createClientActionSchema,
  queryInvoicesActionSchema,
  computeBTWActionSchema,
} from "../schemas/actions";
import { IntentSchema } from "../schemas/drafts";
import { toolCreateInvoiceDraft } from "../tools/invoice-tools";
import { toolCreateOfferteDraft } from "../tools/offerte-tools";
import { toolCreateExpenseDraft } from "../tools/expense-tools";
import { toolCreateClientIfMissing } from "../tools/client-tools";
import { toolListInvoices, toolComputeBTW } from "../tools/query-tools";
import { 
  parseLineItems, 
  parseExpense, 
  parseClient, 
  extractClientName,
  normalizeVatRate,
  normalizeDecimal 
} from "../parsers";
import { generateRequestId, logAIStep } from "../audit";

interface RouterContext {
  userId: string;
  requestId?: string;
}

export type IntentType = 
  | "help_question"
  | "create_factuur"
  | "create_offerte"
  | "create_uitgave"
  | "create_client"
  | "query_invoices"
  | "query_expenses"
  | "compute_btw"
  | "update_settings"
  | "unknown";

export interface RouterResult {
  intent: IntentType;
  requestId: string;
  type?: 
    | "answer" 
    | "create_invoice" 
    | "create_offerte" 
    | "create_expense"
    | "create_client"
    | "query_invoices" 
    | "query_expenses"
    | "compute_btw"
    | "settings_guidance";
  data?: Record<string, unknown>;
  message?: string;
  needsConfirmation?: boolean;
  needsMoreInfo?: boolean;
  missingFields?: string[];
  citations?: string[];
}

/**
 * Detect intent from user message with enhanced classification
 */
function detectIntent(message: string): { intent: IntentType; confidence: number } {
  const normalized = message.toLowerCase();

  // Priority-based keyword matching
  const patterns: Array<{ keywords: string[]; intent: IntentType; priority: number }> = [
    // Expenses (high priority - specific keywords)
    { keywords: ["uitgave", "uitgaven", "kosten", "expense", "uitgave toevoegen"], intent: "create_uitgave", priority: 9 },
    
    // Offerte (high priority to avoid conflicts)
    { keywords: ["offerte", "quotation", "quote", "aanbieding"], intent: "create_offerte", priority: 8 },
    
    // Invoice
    { keywords: ["factuur", "invoice", "maak factuur", "create invoice"], intent: "create_factuur", priority: 7 },
    
    // Client
    { keywords: ["relatie", "klant toevoegen", "nieuwe klant", "add client", "create client"], intent: "create_client", priority: 6 },
    
    // BTW computation
    { keywords: ["btw", "vat", "belasting verschuldigd", "hoeveel btw"], intent: "compute_btw", priority: 5 },
    
    // Queries
    { keywords: ["toon facturen", "laat zien", "show invoices", "welke facturen"], intent: "query_invoices", priority: 4 },
    { keywords: ["toon uitgaven", "show expenses"], intent: "query_expenses", priority: 4 },
    
    // Settings (guidance only)
    { keywords: ["wachtwoord", "password", "instellingen", "settings"], intent: "update_settings", priority: 3 },
    
    // Help questions (low priority - catch-all)
    { keywords: ["hoe", "wat", "help", "uitleg", "how"], intent: "help_question", priority: 1 },
  ];

  let bestMatch: { intent: IntentType; confidence: number } | null = null;

  for (const pattern of patterns) {
    const matches = pattern.keywords.filter(kw => normalized.includes(kw)).length;
    if (matches > 0) {
      const confidence = (matches / pattern.keywords.length) * (pattern.priority / 10);
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { intent: pattern.intent, confidence };
      }
    }
  }

  return bestMatch || { intent: "help_question", confidence: 0.5 };
}

/**
 * Extract invoice parameters using enhanced parsers
 */
function extractInvoiceParams(message: string): {
  clientName?: string;
  amount?: number;
  items?: Array<{ description: string; quantity: number; price: number; unit: string; vatRate: string }>;
  vatRate?: "21" | "9" | "0";
  dueInDays?: number;
  description?: string;
} {
  const params: ReturnType<typeof extractInvoiceParams> = {};

  // Extract client name
  params.clientName = extractClientName(message) || undefined;

  // Try to parse line items first
  const items = parseLineItems(message);
  if (items.length > 0) {
    params.items = items;
    // Use VAT rate from first item
    params.vatRate = items[0].vatRate as "21" | "9" | "0";
  } else {
    // Extract single amount
    const amountMatch = message.match(/(?:bedrag|amount|€)\s*([\d,\.]+)/i);
    if (amountMatch) {
      params.amount = normalizeDecimal(amountMatch[1]);
    }
    
    // Extract VAT rate
    const vatMatch = message.match(/btw\s*([\d,\.]+)%?/i);
    if (vatMatch) {
      params.vatRate = normalizeVatRate(vatMatch[1]);
    }
  }

  // Extract due days
  const dueMatch = message.match(/(?:binnen|in|due)\s+(\d+)\s+(?:dagen|days)/i);
  if (dueMatch) {
    params.dueInDays = parseInt(dueMatch[1]);
  }

  return params;
}

/**
 * Extract offerte parameters using enhanced parsers
 */
function extractOfferteParams(message: string): {
  clientName?: string;
  items?: Array<{ description: string; quantity: number; price: number; unit: string; vatRate: string }>;
  vatRate?: "21" | "9" | "0";
  validForDays?: number;
} {
  const params: ReturnType<typeof extractOfferteParams> = {};

  // Extract client name
  params.clientName = extractClientName(message) || undefined;

  // Parse line items
  const items = parseLineItems(message);
  if (items.length > 0) {
    params.items = items;
    params.vatRate = items[0].vatRate as "21" | "9" | "0";
  }

  // Extract validity period
  const validMatch = message.match(/(?:geldig|valid)\s+(\d+)\s+(?:dagen|days)/i);
  if (validMatch) {
    params.validForDays = parseInt(validMatch[1]);
  }

  return params;
}

/**
 * Handle help questions using knowledge base
 */
async function handleHelpQuestion(message: string, requestId: string): Promise<RouterResult> {
  logAIStep({ requestId, step: "intent_detected", details: { intent: "help_question" } });
  
  const sections = await findRelevantSections(message, 3);
  
  if (sections.length === 0) {
    return {
      intent: "help_question",
      requestId,
      type: "answer",
      message: "Sorry, ik kon geen relevante informatie vinden over je vraag. Probeer het anders te formuleren of neem contact op met support.",
    };
  }

  const contextStr = buildContextString(sections);
  const citations = sections.map((s) => `${s.file}: ${s.heading}`);

  return {
    intent: "help_question",
    requestId,
    type: "answer",
    message: `${contextStr}\n\n*Bron: ${citations.join(", ")}*`,
    citations,
  };
}

/**
 * Handle create invoice intent
 */
async function handleCreateInvoice(
  message: string, 
  context: RouterContext
): Promise<RouterResult> {
  const requestId = context.requestId || generateRequestId();
  logAIStep({ requestId, step: "intent_detected", details: { intent: "create_factuur" } });

  const params = extractInvoiceParams(message);

  // Check for missing required fields
  const missing: string[] = [];
  if (!params.clientName) missing.push("clientName");
  if (!params.amount && (!params.items || params.items.length === 0)) {
    missing.push("amount or items");
  }

  if (missing.length > 0) {
    logAIStep({ requestId, step: "validation_failed", details: { missingFields: missing } });
    return {
      intent: "create_factuur",
      requestId,
      type: "create_invoice",
      needsMoreInfo: true,
      missingFields: missing,
      message: `Om een factuur aan te maken heb ik de volgende informatie nodig: ${missing.join(", ")}. Kun je deze gegevens verstrekken?`,
    };
  }

  // Validate with schema
  try {
    const validated = createInvoiceActionSchema.parse(params);
    logAIStep({ requestId, step: "create_started", details: { clientName: params.clientName } });
    const result = await toolCreateInvoiceDraft(validated, { userId: context.userId });

    if (result.success) {
      logAIStep({ requestId, step: "create_success", details: { invoiceId: result.invoice?.id } });
    } else {
      logAIStep({ requestId, step: "create_failed", details: { error: result.message } });
    }

    return {
      intent: "create_factuur",
      requestId,
      type: "create_invoice",
      data: result,
      needsConfirmation: result.success,
      message: result.message,
    };
  } catch (error: unknown) {
    logAIStep({ requestId, step: "create_failed", details: { error: String(error) } });
    return {
      intent: "create_factuur",
      requestId,
      type: "create_invoice",
      data: { success: false },
      message: `Fout bij validatie: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Handle create offerte intent
 */
async function handleCreateOfferte(
  message: string, 
  context: RouterContext
): Promise<RouterResult> {
  const requestId = context.requestId || generateRequestId();
  logAIStep({ requestId, step: "intent_detected", details: { intent: "create_offerte" } });

  const params = extractOfferteParams(message);

  // Check for missing fields
  if (!params.clientName) {
    logAIStep({ requestId, step: "validation_failed", details: { missingFields: ["clientName"] } });
    return {
      intent: "create_offerte",
      requestId,
      type: "create_offerte",
      needsMoreInfo: true,
      missingFields: ["clientName"],
      message: "Voor welke klant is deze offerte?",
    };
  }
  
  if (!params.items || params.items.length === 0) {
    logAIStep({ requestId, step: "validation_failed", details: { missingFields: ["items"] } });
    return {
      intent: "create_offerte",
      requestId,
      type: "create_offerte",
      needsMoreInfo: true,
      missingFields: ["items"],
      message: "Welke items/aantal/prijs wil je in de offerte opnemen?",
    };
  }

  try {
    const validated = createOfferteActionSchema.parse(params);
    logAIStep({ requestId, step: "create_started", details: { clientName: params.clientName } });
    const result = await toolCreateOfferteDraft(validated, { userId: context.userId });

    if (result.success && result.quotation) {
      logAIStep({ requestId, step: "create_success", details: { quotationId: result.quotation.id } });
      
      const quotation = result.quotation;
      const confirmationMessage = `Offerte preview voor ${quotation.clientName}:\n\n` +
        (quotation.lines || []).map((line: { description: string; quantity: number; price: number }) => 
          `- ${line.description}: ${line.quantity}x €${line.price.toFixed(2)}`
        ).join('\n') +
        `\n\nSubtotaal: €${quotation.total.toFixed(2)}` +
        `\nBTW (${params.vatRate || "21"}%): €${quotation.vatAmount.toFixed(2)}` +
        `\nTotaal: €${quotation.totalWithVat.toFixed(2)}`;

      return {
        intent: "create_offerte",
        requestId,
        type: "create_offerte",
        data: result,
        needsConfirmation: true,
        message: confirmationMessage,
      };
    }

    logAIStep({ requestId, step: "create_failed", details: { error: result.message } });
    return {
      intent: "create_offerte",
      requestId,
      type: "create_offerte",
      data: result,
      message: result.message || "Er is een fout opgetreden bij het aanmaken van de offerte.",
    };
  } catch (error: unknown) {
    logAIStep({ requestId, step: "create_failed", details: { error: String(error) } });
    return {
      intent: "create_offerte",
      requestId,
      type: "create_offerte",
      data: { success: false },
      message: `Fout: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Handle create expense intent
 */
async function handleCreateExpense(
  message: string, 
  context: RouterContext
): Promise<RouterResult> {
  const requestId = context.requestId || generateRequestId();
  logAIStep({ requestId, step: "intent_detected", details: { intent: "create_uitgave" } });

  const parsed = parseExpense(message);

  const missing: string[] = [];
  if (!parsed.category) missing.push("category");
  if (!parsed.amount) missing.push("amount");

  if (missing.length > 0) {
    logAIStep({ requestId, step: "validation_failed", details: { missingFields: missing } });
    return {
      intent: "create_uitgave",
      requestId,
      type: "create_expense",
      needsMoreInfo: true,
      missingFields: missing,
      message: `Voor een uitgave heb ik nodig: ${missing.join(", ")}`,
    };
  }

  try {
    const validated = createExpenseActionSchema.parse(parsed);
    logAIStep({ requestId, step: "create_started" });
    const result = await toolCreateExpenseDraft(validated, { userId: context.userId });

    if (result.success) {
      logAIStep({ requestId, step: "create_success", details: { expenseId: result.expense?.id } });
    }

    return {
      intent: "create_uitgave",
      requestId,
      type: "create_expense",
      data: result,
      needsConfirmation: result.success,
      message: result.message,
    };
  } catch (error: unknown) {
    logAIStep({ requestId, step: "create_failed", details: { error: String(error) } });
    return {
      intent: "create_uitgave",
      requestId,
      type: "create_expense",
      data: { success: false },
      message: `Fout: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Handle create client intent
 */
async function handleCreateClient(
  message: string, 
  context: RouterContext
): Promise<RouterResult> {
  const requestId = context.requestId || generateRequestId();
  logAIStep({ requestId, step: "intent_detected", details: { intent: "create_client" } });

  const parsed = parseClient(message);

  if (!parsed.name) {
    logAIStep({ requestId, step: "validation_failed", details: { missingFields: ["name"] } });
    return {
      intent: "create_client",
      requestId,
      type: "create_client",
      needsMoreInfo: true,
      missingFields: ["name"],
      message: "Wat is de naam van de klant/relatie?",
    };
  }

  try {
    const validated = createClientActionSchema.parse(parsed);
    logAIStep({ requestId, step: "create_started", details: { clientName: parsed.name } });
    const result = await toolCreateClientIfMissing(validated, { userId: context.userId });

    if (result.success) {
      logAIStep({ requestId, step: "create_success", details: { clientId: result.client?.id } });
    }

    return {
      intent: "create_client",
      requestId,
      type: "create_client",
      data: result,
      message: result.message,
    };
  } catch (error: unknown) {
    logAIStep({ requestId, step: "create_failed", details: { error: String(error) } });
    return {
      intent: "create_client",
      requestId,
      type: "create_client",
      data: { success: false },
      message: `Fout: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Handle query invoices intent
 */
async function handleQueryInvoices(
  message: string, 
  context: RouterContext
): Promise<RouterResult> {
  const requestId = context.requestId || generateRequestId();
  logAIStep({ requestId, step: "intent_detected", details: { intent: "query_invoices" } });

  const normalized = message.toLowerCase();
  const params: {
    limit: number;
    status?: "CONCEPT" | "VERZONDEN" | "BETAALD" | "HERINNERING";
    fromDate?: string;
    toDate?: string;
  } = { limit: 10 };

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
  const result = await toolListInvoices(validated, { userId: context.userId });

  return {
    intent: "query_invoices",
    requestId,
    type: "query_invoices",
    data: result,
    message: `${result.count} facturen gevonden.`,
  };
}

/**
 * Handle BTW computation
 */
async function handleComputeBTW(
  message: string, 
  context: RouterContext
): Promise<RouterResult> {
  const requestId = context.requestId || generateRequestId();
  logAIStep({ requestId, step: "intent_detected", details: { intent: "compute_btw" } });

  const normalized = message.toLowerCase();
  const params: { period?: "month" | "quarter" | "year" } = {};

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
  const result = await toolComputeBTW(validated, { userId: context.userId });

  return {
    intent: "compute_btw",
    requestId,
    type: "compute_btw",
    data: result,
    message: result.summary,
  };
}

/**
 * Handle settings guidance (no actual changes via AI)
 */
function handleSettingsGuidance(requestId: string): RouterResult {
  logAIStep({ requestId, step: "intent_detected", details: { intent: "update_settings" } });
  
  return {
    intent: "update_settings",
    requestId,
    type: "settings_guidance",
    message: "Voor het wijzigen van instellingen zoals je wachtwoord, ga naar het Instellingen menu in de sidebar. Ik kan je hier niet mee helpen via chat om beveiligingsredenen.",
  };
}

/**
 * Main router function
 */
export async function routeAIRequest(
  message: string,
  context: RouterContext
): Promise<RouterResult> {
  const requestId = context.requestId || generateRequestId();
  const { intent, confidence } = detectIntent(message);

  // Validate intent with schema
  try {
    IntentSchema.parse({ intent, confidence });
  } catch (error) {
    return {
      intent: "unknown",
      requestId,
      message: "Sorry, ik kon je verzoek niet begrijpen. Probeer het anders te formuleren.",
    };
  }

  const contextWithRequestId = { ...context, requestId };

  switch (intent) {
    case "help_question":
      return handleHelpQuestion(message, requestId);
    case "create_factuur":
      return handleCreateInvoice(message, contextWithRequestId);
    case "create_offerte":
      return handleCreateOfferte(message, contextWithRequestId);
    case "create_uitgave":
      return handleCreateExpense(message, contextWithRequestId);
    case "create_client":
      return handleCreateClient(message, contextWithRequestId);
    case "query_invoices":
      return handleQueryInvoices(message, contextWithRequestId);
    case "compute_btw":
      return handleComputeBTW(message, contextWithRequestId);
    case "update_settings":
      return handleSettingsGuidance(requestId);
    default:
      return {
        intent: "unknown",
        requestId,
        message: "Sorry, ik begrijp je vraag niet. Kun je het anders formuleren?",
      };
  }
}
