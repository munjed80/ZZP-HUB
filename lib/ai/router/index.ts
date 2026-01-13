import { findRelevantSections, buildContextString } from "./knowledge-loader";
import {
  createInvoiceActionSchema,
  createOfferteActionSchema,
  queryInvoicesActionSchema,
  computeBTWActionSchema,
} from "../schemas/actions";
import { toolCreateInvoiceDraft } from "../tools/invoice-tools";
import { toolCreateOfferteDraft } from "../tools/offerte-tools";
import { toolListInvoices, toolComputeBTW } from "../tools/query-tools";

interface RouterContext {
  userId: string;
}

export type IntentType = "question" | "action" | "unknown";

export interface RouterResult {
  intent: IntentType;
  type?: "answer" | "create_invoice" | "create_offerte" | "query_invoices" | "compute_btw" | "create_client";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Action keywords - offerte has priority to avoid generic docs
  const createOfferteKeywords = ["offerte", "quotation", "quote", "aanbieding", "maak een offerte", "create quote"];
  const createInvoiceKeywords = ["maak", "create", "genereer", "factuur", "invoice"];
  const queryKeywords = ["toon", "laat zien", "show", "list", "hoeveel", "welke", "wat"];
  const btwKeywords = ["btw", "vat", "belasting", "verschuldigd"];

  // Check for create offerte FIRST (highest priority)
  if (createOfferteKeywords.some((kw) => normalized.includes(kw))) {
    return { intent: "action", actionType: "create_offerte" };
  }

  // Check for create invoice
  if (createInvoiceKeywords.some((kw) => normalized.includes(kw)) && 
      !createOfferteKeywords.some((kw) => normalized.includes(kw))) {
    return { intent: "action", actionType: "create_invoice" };
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
function extractInvoiceParams(message: string): {
  clientName?: string;
  amount?: number;
  vatRate?: "21" | "9" | "0";
  dueInDays?: number;
  description?: string;
} {
  const normalized = message.toLowerCase();
  const params: {
    clientName?: string;
    amount?: number;
    vatRate?: "21" | "9" | "0";
    dueInDays?: number;
    description?: string;
  } = {};

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
 * Extract offerte-specific parameters from message with robust pattern matching
 * Supports patterns:
 * - "<client> <qty> <item> price <unitPrice>"  => "Riza 320 stops price 1.25"
 * - "<qty>x <item> @ <unitPrice> for <client>" => "320x stops @ 1.25 for Riza"
 * - "<client> <qty> <item> à <unitPrice>"      => "Riza 320 stops à €1.25"
 */
function extractOfferteParams(message: string): {
  clientName?: string;
  items?: Array<{
    description: string;
    quantity: number;
    price: number;
    unit: string;
    vatRate: string;
  }>;
  vatRate?: "21" | "9" | "0";
  notes?: string;
  dueDate?: string;
} {
  const normalized = message.toLowerCase();
  const params: {
    clientName?: string;
    items?: Array<{
      description: string;
      quantity: number;
      price: number;
      unit: string;
      vatRate: string;
    }>;
    vatRate?: "21" | "9" | "0";
    notes?: string;
    dueDate?: string;
  } = {};

  // Remove common prefixes that might interfere with parsing
  const PREFIX_PATTERN = /^(?:maak|create|genereer)?\s*(?:een|a)?\s*(?:offerte|quote|quotation|aanbieding)?\s*/i;
  const cleanMessage = message.replace(PREFIX_PATTERN, "").trim();

  // Pattern 1: "<client> <qty> <item> price <unitPrice>"
  // Groups: (1)clientName (2)quantity (3)description (4)price
  // Example: "Riza 320 stops price 1.25"
  // Supports client names and items with letters, spaces, numbers, hyphens, ampersands, and apostrophes
  const PATTERN_CLIENT_QTY_ITEM_PRICE = /^([A-Za-z0-9\s\-&']+?)\s+(\d+)\s+([A-Za-z0-9\s\-&']+?)\s+(?:price|prijs|à|@)\s*€?\s*(\d+(?:[.,]\d+)?)/i;
  const pattern1 = cleanMessage.match(PATTERN_CLIENT_QTY_ITEM_PRICE);
  if (pattern1) {
    params.clientName = pattern1[1].trim();
    const quantity = parseInt(pattern1[2]);
    const description = pattern1[3].trim();
    const price = parseFloat(pattern1[4].replace(",", "."));
    
    params.items = [{
      description,
      quantity,
      price,
      unit: "STUK",
      vatRate: "21",
    }];
  }

  // Pattern 2: "<qty>x <item> @ <unitPrice> for <client>"
  // Groups: (1)quantity (2)description (3)price (4)clientName
  // Example: "320x stops @ 1.25 for Riza"
  // Supports client names and items with letters, spaces, numbers, hyphens, ampersands, and apostrophes
  const PATTERN_QTY_ITEM_PRICE_FOR_CLIENT = /^(\d+)x?\s+([A-Za-z0-9\s\-&']+?)\s+(?:@|à|price|prijs)\s*€?\s*(\d+(?:[.,]\d+)?)\s+(?:for|voor)\s+([A-Za-z0-9\s\-&']+)/i;
  const pattern2 = cleanMessage.match(PATTERN_QTY_ITEM_PRICE_FOR_CLIENT);
  if (pattern2 && !pattern1) {
    const quantity = parseInt(pattern2[1]);
    const description = pattern2[2].trim();
    const price = parseFloat(pattern2[3].replace(",", "."));
    params.clientName = pattern2[4].trim();
    
    params.items = [{
      description,
      quantity,
      price,
      unit: "STUK",
      vatRate: "21",
    }];
  }

  // Pattern 3: "<client> <item> <qty> stuks <unitPrice> per stuk"
  // Groups: (1)clientName (2)description (3)quantity (4)price
  // Example: "Riza stops 320 stuks 1.25 per stuk"
  // Supports client names and items with letters, spaces, numbers, hyphens, ampersands, and apostrophes
  const PATTERN_CLIENT_ITEM_QTY_STUKS_PRICE = /^([A-Za-z0-9\s\-&']+?)\s+([A-Za-z0-9\s\-&']+?)\s+(\d+)\s+(?:stuks?|pieces?|x)\s+€?\s*(\d+(?:[.,]\d+)?)\s*(?:per|each)?/i;
  const pattern3 = cleanMessage.match(PATTERN_CLIENT_ITEM_QTY_STUKS_PRICE);
  if (pattern3 && !pattern1 && !pattern2) {
    params.clientName = pattern3[1].trim();
    const description = pattern3[2].trim();
    const quantity = parseInt(pattern3[3]);
    const price = parseFloat(pattern3[4].replace(",", "."));
    
    params.items = [{
      description,
      quantity,
      price,
      unit: "STUK",
      vatRate: "21",
    }];
  }

  // If no structured pattern matched, try fallback extraction
  if (!params.items) {
    // Extract client name (after "voor" or "for")
    const clientMatch = message.match(/(?:voor|for)\s+([A-Za-z\s]+?)(?:\s*,|\s+\d|$)/i);
    if (clientMatch) {
      params.clientName = clientMatch[1].trim();
    }

    // Extract quantity and description
    const qtyDescMatch = cleanMessage.match(/^(\d+)\s*x?\s+([A-Za-z\s]+?)(?:\s+(?:@|à|price|prijs|voor|for)|$)/i);
    if (qtyDescMatch) {
      const quantity = parseInt(qtyDescMatch[1]);
      const description = qtyDescMatch[2].trim();
      
      // Extract price
      const priceMatch = message.match(/(?:price|prijs|@|à)\s*€?\s*(\d+(?:[.,]\d+)?)/i);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(",", "."));
        
        params.items = [{
          description,
          quantity,
          price,
          unit: "STUK",
          vatRate: "21",
        }];
      }
    }
  }

  // Extract VAT rate
  if (normalized.includes("21%") || normalized.includes("21 %")) {
    params.vatRate = "21";
  } else if (normalized.includes("9%") || normalized.includes("9 %")) {
    params.vatRate = "9";
  } else if (normalized.includes("0%") || normalized.includes("0 %")) {
    params.vatRate = "0";
  } else {
    // Default to 21%
    params.vatRate = "21";
  }

  return params;
}

/**
 * Answer question using product knowledge
 */
async function handleQuestion(message: string): Promise<RouterResult> {
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
  if (!params.amount) missing.push("amount or items");

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
  } catch (error: unknown) {
    return {
      intent: "action",
      type: "create_invoice",
      data: { success: false, error: error instanceof Error ? error.message : String(error) },
      message: `Fout bij validatie: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Handle create offerte action
 */
async function handleCreateOfferte(message: string, context: RouterContext): Promise<RouterResult> {
  const params = extractOfferteParams(message);

  // Check for missing required fields with specific Dutch messages
  if (!params.clientName) {
    return {
      intent: "action",
      type: "create_offerte",
      needsMoreInfo: true,
      missingFields: ["clientName"],
      message: "Welke klantnaam?",
    };
  }
  
  if (!params.items || params.items.length === 0) {
    return {
      intent: "action",
      type: "create_offerte",
      needsMoreInfo: true,
      missingFields: ["items"],
      message: "Welke items/aantal/prijs?",
    };
  }

  // Build the offerte data with explicit VAT rate (defaulting to 21%)
  const offerteData = {
    clientName: params.clientName,
    items: params.items,
    vatRate: params.vatRate || "21",
  };

  try {
    const validated = createOfferteActionSchema.parse(offerteData);
    const result = await toolCreateOfferteDraft(validated, context);

    if (result.success && result.quotation) {
      // Return with confirmation request showing VAT rate
      const quotation = result.quotation;
      const confirmationMessage = `Offerte preview voor ${quotation.clientName}:\n\n` +
        (quotation.lines || []).map((line: { description: string; quantity: number; price: number }) => 
          `- ${line.description}: ${line.quantity}x €${line.price.toFixed(2)}`
        ).join('\n') +
        `\n\nSubtotaal: €${quotation.total.toFixed(2)}` +
        `\nBTW (${offerteData.vatRate}%): €${quotation.vatAmount.toFixed(2)}` +
        `\nTotaal: €${quotation.totalWithVat.toFixed(2)}` +
        `\n\nBevestigen? (Ja/Nee)`;

      return {
        intent: "action",
        type: "create_offerte",
        data: result,
        needsConfirmation: true,
        message: confirmationMessage,
      };
    }

    return {
      intent: "action",
      type: "create_offerte",
      data: result,
      needsConfirmation: false,
      message: result.message || "Er is een fout opgetreden bij het aanmaken van de offerte.",
    };
  } catch (error: unknown) {
    return {
      intent: "action",
      type: "create_offerte",
      data: { success: false, error: error instanceof Error ? error.message : String(error) },
      message: `Fout: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Handle query invoices
 */
async function handleQueryInvoices(message: string, context: RouterContext): Promise<RouterResult> {
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
  const params: {
    period?: "month" | "quarter" | "year";
  } = {};

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
    return handleQuestion(message);
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
