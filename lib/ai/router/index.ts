import { findRelevantSections, buildContextString } from "./knowledge-loader";
import {
  createExpenseActionSchema,
  queryInvoicesActionSchema,
  computeBTWActionSchema,
} from "../schemas/actions";
import { IntentSchema } from "../schemas/drafts";
import { toolCreateExpenseDraft } from "../tools/expense-tools";
import { toolListInvoices, toolComputeBTW } from "../tools/query-tools";
import { 
  parseExpense, 
} from "../parsers";
import { generateRequestId, logAIStep } from "../audit";
import { 
  handleMultiStepMessage, 
  isMultiStepIntent,
  getActiveConversation,
  type MultiStepIntent 
} from "../conversation-manager";

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

export type RouterResultType = 
  | "answer" 
  | "create_invoice" 
  | "create_offerte" 
  | "create_expense"
  | "create_client"
  | "query_invoices" 
  | "query_expenses"
  | "compute_btw"
  | "settings_guidance";

export interface RouterResult {
  intent: IntentType;
  requestId: string;
  type?: RouterResultType;
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
 * Handle create expense intent
 * Note: Expenses still use single-shot flow as they are simpler
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
      message: `Wat is de categorie en het bedrag van de uitgave?`,
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
  } catch {
    logAIStep({ requestId, step: "create_failed" });
    return {
      intent: "create_uitgave",
      requestId,
      type: "create_expense",
      data: { success: false },
      message: "Er ging iets mis bij het registreren van de uitgave. Probeer het opnieuw.",
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
 * Now supports multi-step conversation flow for create actions
 */
export async function routeAIRequest(
  message: string,
  context: RouterContext
): Promise<RouterResult> {
  const requestId = context.requestId || generateRequestId();
  
  // Step 1: Check if there's an active multi-step conversation
  // If so, continue that conversation regardless of message content
  const activeConversation = await getActiveConversation(context.userId);
  
  if (activeConversation && isMultiStepIntent(activeConversation.intent)) {
    // Check if user wants to cancel
    const normalizedMessage = message.toLowerCase().trim();
    if (["annuleren", "cancel", "stop", "afbreken", "nee"].includes(normalizedMessage)) {
      const { cancelConversation } = await import("../conversation-manager");
      await cancelConversation(activeConversation.conversationId, context.userId);
      return {
        intent: activeConversation.intent as IntentType,
        requestId,
        message: "Begrepen, ik heb de actie geannuleerd. Waarmee kan ik je helpen?",
      };
    }

    // Continue the active conversation
    logAIStep({ requestId, step: "intent_detected", details: { 
      intent: activeConversation.intent, 
      continuing: true,
      conversationId: activeConversation.conversationId 
    }});
    
    const result = await handleMultiStepMessage(
      message,
      activeConversation.intent as MultiStepIntent,
      context.userId,
      requestId
    );

    return {
      intent: result.intent as IntentType,
      requestId: result.requestId,
      type: result.type as RouterResultType | undefined,
      data: result.data,
      message: result.message,
      needsMoreInfo: result.needsMoreInfo,
      missingFields: result.missingFields,
    };
  }

  // Step 2: Detect intent from the message
  const { intent, confidence } = detectIntent(message);

  // Validate intent with schema
  try {
    IntentSchema.parse({ intent, confidence });
  } catch {
    return {
      intent: "unknown",
      requestId,
      message: "Sorry, ik kon je verzoek niet begrijpen. Probeer het anders te formuleren.",
    };
  }

  const contextWithRequestId = { ...context, requestId };

  // Step 3: Route to appropriate handler
  // Multi-step intents use the conversation manager
  if (isMultiStepIntent(intent)) {
    logAIStep({ requestId, step: "intent_detected", details: { intent, isMultiStep: true }});
    
    const result = await handleMultiStepMessage(
      message,
      intent,
      context.userId,
      requestId
    );

    return {
      intent: result.intent as IntentType,
      requestId: result.requestId,
      type: result.type as RouterResultType | undefined,
      data: result.data,
      message: result.message,
      needsMoreInfo: result.needsMoreInfo,
      missingFields: result.missingFields,
    };
  }

  // Non-multi-step intents use existing handlers
  switch (intent) {
    case "help_question":
      return handleHelpQuestion(message, requestId);
    case "create_uitgave":
      return handleCreateExpense(message, contextWithRequestId);
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
