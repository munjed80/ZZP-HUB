import { prisma } from "@/lib/prisma";
import { generateRequestId, logAIStep } from "./audit";
import { 
  ClientDraftSchema, 
  InvoiceDraftSchema, 
  OfferteDraftSchema,
  type ConversationState 
} from "./schemas/drafts";
import { toolCreateInvoiceDraft } from "./tools/invoice-tools";
import { toolCreateOfferteDraft } from "./tools/offerte-tools";
import { toolCreateClientIfMissing } from "./tools/client-tools";
import { 
  extractClientName, 
  parseLineItems, 
  parseClient,
  normalizeDecimal,
  normalizeVatRate 
} from "./parsers";
import { z } from "zod";

/**
 * Intent types supported by multi-step flow
 */
export type MultiStepIntent = 
  | "create_client"
  | "create_factuur" 
  | "create_offerte";

/**
 * Mapping of field names to natural Dutch questions
 * Used to convert validation errors into user-friendly prompts
 */
const FIELD_QUESTIONS: Record<string, Record<string, string>> = {
  create_client: {
    name: "Wat is de naam van de klant of het bedrijf?",
    email: "Wat is het e-mailadres van de klant?",
    address: "Wat is het adres?",
    postalCode: "Wat is de postcode?",
    city: "In welke stad is de klant gevestigd?",
    kvkNumber: "Wat is het KVK-nummer? (optioneel)",
    btwId: "Wat is het BTW-ID? (optioneel)",
  },
  create_factuur: {
    clientName: "Voor welke klant is deze factuur?",
    items: "Welke diensten of producten wil je factureren? (Beschrijf met aantal en prijs, bijv. '10 uur @ 75 euro')",
    amount: "Wat is het factuurbedrag?",
    dueInDays: "Binnen hoeveel dagen moet de factuur betaald worden? (standaard 14 dagen)",
    vatRate: "Welk BTW-tarief? (21%, 9%, of 0%)",
  },
  create_offerte: {
    clientName: "Voor welke klant is deze offerte?",
    items: "Welke diensten of producten wil je aanbieden? (Beschrijf met aantal en prijs, bijv. '320 stops @ 1.25 euro')",
    amount: "Wat is het offertebedrag?",
    validForDays: "Hoeveel dagen is de offerte geldig? (standaard 30 dagen)",
    vatRate: "Welk BTW-tarief? (21%, 9%, of 0%)",
  },
};

/**
 * Priority order for asking fields (most important first)
 */
const FIELD_PRIORITY: Record<string, string[]> = {
  create_client: ["name", "email", "city", "address", "postalCode"],
  create_factuur: ["clientName", "items", "amount", "vatRate", "dueInDays"],
  create_offerte: ["clientName", "items", "amount", "vatRate", "validForDays"],
};

/**
 * Get the schema for a given intent
 */
function getSchemaForIntent(intent: string): z.ZodSchema | null {
  switch (intent) {
    case "create_client":
      return ClientDraftSchema;
    case "create_factuur":
      return InvoiceDraftSchema;
    case "create_offerte":
      return OfferteDraftSchema;
    default:
      return null;
  }
}

/**
 * Get or create an active conversation for a user
 */
export async function getActiveConversation(
  userId: string,
  intent?: string
): Promise<ConversationState | null> {
  const draft = await prisma.conversationDraft.findFirst({
    where: {
      userId,
      status: { in: ["collecting", "validating", "previewing"] },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!draft) return null;

  // If intent is provided and different from active conversation, 
  // the user might be starting a new action
  if (intent && draft.intent !== intent) {
    return null;
  }

  return {
    conversationId: draft.conversationId,
    userId: draft.userId,
    intent: draft.intent,
    draft: JSON.parse(draft.draftJson),
    status: draft.status as ConversationState["status"],
    lastUpdated: draft.updatedAt.toISOString(),
  };
}

/**
 * Create a new conversation for multi-step flow
 */
export async function createConversation(
  userId: string,
  intent: string,
  initialDraft: Record<string, unknown> = {}
): Promise<ConversationState> {
  const conversationId = generateRequestId();
  
  const created = await prisma.conversationDraft.create({
    data: {
      conversationId,
      userId,
      intent,
      draftJson: JSON.stringify(initialDraft),
      status: "collecting",
    },
  });

  return {
    conversationId: created.conversationId,
    userId: created.userId,
    intent: created.intent,
    draft: initialDraft,
    status: "collecting",
    lastUpdated: created.updatedAt.toISOString(),
  };
}

/**
 * Update a conversation draft with new data
 */
export async function updateConversation(
  conversationId: string,
  userId: string,
  updates: Record<string, unknown>,
  status?: ConversationState["status"]
): Promise<ConversationState> {
  const existing = await prisma.conversationDraft.findUnique({
    where: { conversationId },
  });

  if (!existing || existing.userId !== userId) {
    throw new Error("Conversatie niet gevonden of geen toegang");
  }

  const currentDraft = JSON.parse(existing.draftJson);
  const updatedDraft = { ...currentDraft, ...updates };

  const updated = await prisma.conversationDraft.update({
    where: { conversationId },
    data: {
      draftJson: JSON.stringify(updatedDraft),
      status: status || existing.status,
      updatedAt: new Date(),
    },
  });

  return {
    conversationId: updated.conversationId,
    userId: updated.userId,
    intent: updated.intent,
    draft: updatedDraft,
    status: updated.status as ConversationState["status"],
    lastUpdated: updated.updatedAt.toISOString(),
  };
}

/**
 * Complete (close) a conversation after successful execution
 */
export async function completeConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  await prisma.conversationDraft.updateMany({
    where: { conversationId, userId },
    data: { status: "confirmed", updatedAt: new Date() },
  });
}

/**
 * Cancel an active conversation
 */
export async function cancelConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  await prisma.conversationDraft.updateMany({
    where: { conversationId, userId },
    data: { status: "cancelled", updatedAt: new Date() },
  });
}

/**
 * Validate a draft against its schema and return missing fields
 */
export function validateDraft(
  intent: string,
  draft: Record<string, unknown>
): { isValid: boolean; missingFields: string[]; validationErrors: string[] } {
  const schema = getSchemaForIntent(intent);
  if (!schema) {
    return { isValid: false, missingFields: [], validationErrors: ["Onbekende intent"] };
  }

  const result = schema.safeParse(draft);
  
  if (result.success) {
    return { isValid: true, missingFields: [], validationErrors: [] };
  }

  const missingFields: string[] = [];
  const validationErrors: string[] = [];

  result.error.errors.forEach((err) => {
    const field = err.path.join(".");
    // Check if field is missing (undefined) vs has an invalid value
    if (err.code === "invalid_type" && err.received === "undefined") {
      missingFields.push(field);
    } else if (err.code === "too_small" && err.minimum === 1) {
      // Required string that is empty
      missingFields.push(field);
    } else {
      validationErrors.push(`${field}: ${err.message}`);
    }
  });

  return { isValid: false, missingFields, validationErrors };
}

/**
 * Get the next question to ask based on missing fields
 * Returns user-friendly Dutch text, never raw validation errors
 */
export function getNextQuestion(
  intent: string,
  missingFields: string[]
): string {
  if (missingFields.length === 0) {
    return "Alle gegevens zijn compleet!";
  }

  const questions = FIELD_QUESTIONS[intent] || {};
  const priority = FIELD_PRIORITY[intent] || [];

  // Find the highest priority missing field
  for (const field of priority) {
    if (missingFields.includes(field) && questions[field]) {
      return questions[field];
    }
  }

  // Fallback: ask for first missing field
  const firstMissing = missingFields[0];
  if (questions[firstMissing]) {
    return questions[firstMissing];
  }

  // Generic fallback
  return `Ik heb nog wat extra informatie nodig. Kun je meer details geven?`;
}

/**
 * Parse user message and extract field values based on intent
 */
export function parseMessageForIntent(
  intent: string,
  message: string,
  existingDraft: Record<string, unknown>
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  switch (intent) {
    case "create_client": {
      const parsed = parseClient(message);
      if (parsed.name && !existingDraft.name) updates.name = parsed.name;
      if (parsed.email && !existingDraft.email) updates.email = parsed.email;
      if (parsed.address && !existingDraft.address) updates.address = parsed.address;
      if (parsed.postalCode && !existingDraft.postalCode) updates.postalCode = parsed.postalCode;
      if (parsed.city && !existingDraft.city) updates.city = parsed.city;
      if (parsed.kvkNumber && !existingDraft.kvkNumber) updates.kvkNumber = parsed.kvkNumber;
      if (parsed.btwId && !existingDraft.btwId) updates.btwId = parsed.btwId;
      
      // If we're missing name and got a simple text response, treat it as the name
      if (!existingDraft.name && !updates.name) {
        const cleanedMessage = message.trim();
        // Simple heuristic: if message is just a name (no special chars, < 50 chars)
        if (cleanedMessage.length > 0 && cleanedMessage.length < 50 && !cleanedMessage.includes("@")) {
          updates.name = cleanedMessage;
        }
      }
      break;
    }

    case "create_factuur":
    case "create_offerte": {
      // Extract client name
      const clientName = extractClientName(message);
      if (clientName && !existingDraft.clientName) {
        updates.clientName = clientName;
      }

      // Parse line items
      const items = parseLineItems(message);
      if (items.length > 0) {
        const existingItems = (existingDraft.items as Array<unknown>) || [];
        updates.items = [...existingItems, ...items];
      }

      // Extract simple amount if no items parsed
      if (items.length === 0 && !existingDraft.amount) {
        const amountMatch = message.match(/(?:bedrag|amount|€)\s*([\d,\.]+)/i);
        if (amountMatch) {
          updates.amount = normalizeDecimal(amountMatch[1]);
        }
        // Also try to parse just a number
        const simpleAmount = message.match(/^[\d,\.]+$/);
        if (simpleAmount) {
          updates.amount = normalizeDecimal(simpleAmount[0]);
        }
      }

      // Extract VAT rate if mentioned
      const vatMatch = message.match(/btw\s*([\d,\.]+)%?/i);
      if (vatMatch) {
        updates.vatRate = normalizeVatRate(vatMatch[1]);
      }

      // If we're missing clientName and got a simple text (potential name)
      if (!existingDraft.clientName && !updates.clientName) {
        const cleanedMessage = message.trim();
        // If it looks like just a name (no numbers, short)
        if (cleanedMessage.length > 0 && cleanedMessage.length < 50 && !/\d/.test(cleanedMessage)) {
          updates.clientName = cleanedMessage;
        }
      }
      break;
    }
  }

  return updates;
}

/**
 * Execute the action for a completed draft
 */
async function executeAction(
  intent: string,
  draft: Record<string, unknown>,
  userId: string,
  requestId: string
): Promise<{
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  type?: string;
}> {
  logAIStep({ requestId, step: "create_started", details: { intent, draft } });

  try {
    switch (intent) {
      case "create_client": {
        const result = await toolCreateClientIfMissing(
          {
            name: draft.name as string,
            email: draft.email as string,
            address: draft.address as string | undefined,
            postalCode: draft.postalCode as string | undefined,
            city: draft.city as string | undefined,
            kvkNumber: draft.kvkNumber as string | undefined,
            btwId: draft.btwId as string | undefined,
          },
          { userId }
        );

        if (result.success) {
          logAIStep({ requestId, step: "create_success", details: { clientId: result.client?.id } });
          return {
            success: true,
            message: result.alreadyExists 
              ? `Klant "${result.client?.name}" bestond al in je systeem.`
              : `Klant "${result.client?.name}" is succesvol aangemaakt!`,
            data: result,
            type: "create_client",
          };
        }
        
        logAIStep({ requestId, step: "create_failed", details: { error: result.message } });
        return { success: false, message: result.message || "Er ging iets mis bij het aanmaken van de klant." };
      }

      case "create_factuur": {
        const result = await toolCreateInvoiceDraft(
          {
            clientName: draft.clientName as string,
            items: draft.items as Array<{ description: string; quantity: number; price: number; unit: "UUR" | "STUK" | "PROJECT" | "KM" | "LICENTIE" | "STOP"; vatRate: "21" | "9" | "0" }> | undefined,
            amount: draft.amount as number | undefined,
            vatRate: (draft.vatRate as "21" | "9" | "0") || "21",
            dueInDays: (draft.dueInDays as number) || 14,
            description: draft.description as string | undefined,
          },
          { userId }
        );

        if (result.success && result.invoice) {
          logAIStep({ requestId, step: "create_success", details: { invoiceId: result.invoice.id } });
          return {
            success: true,
            message: `Factuur ${result.invoice.invoiceNum} voor ${result.invoice.clientName} is aangemaakt! Totaal: €${result.invoice.totalWithVat.toFixed(2)}`,
            data: result,
            type: "create_invoice",
          };
        }
        
        if (result.needsClientCreation) {
          logAIStep({ requestId, step: "create_failed", details: { reason: "client_not_found" } });
          return {
            success: false,
            message: `Klant "${draft.clientName}" is niet gevonden. Wil je deze klant eerst aanmaken?`,
          };
        }

        logAIStep({ requestId, step: "create_failed", details: { error: result.message } });
        return { success: false, message: result.message || "Er ging iets mis bij het aanmaken van de factuur." };
      }

      case "create_offerte": {
        const result = await toolCreateOfferteDraft(
          {
            clientName: draft.clientName as string,
            items: draft.items as Array<{ description: string; quantity: number; price: number; unit: "UUR" | "STUK" | "PROJECT" | "KM" | "LICENTIE" | "STOP"; vatRate: "21" | "9" | "0" }> | undefined,
            amount: draft.amount as number | undefined,
            vatRate: (draft.vatRate as "21" | "9" | "0") || "21",
            validForDays: (draft.validForDays as number) || 30,
            description: draft.description as string | undefined,
          },
          { userId }
        );

        if (result.success && result.quotation) {
          logAIStep({ requestId, step: "create_success", details: { quotationId: result.quotation.id } });
          return {
            success: true,
            message: `Offerte ${result.quotation.quoteNum} voor ${result.quotation.clientName} is aangemaakt! Totaal: €${result.quotation.totalWithVat.toFixed(2)}`,
            data: result,
            type: "create_offerte",
          };
        }

        if (result.needsClientCreation) {
          logAIStep({ requestId, step: "create_failed", details: { reason: "client_not_found" } });
          return {
            success: false,
            message: `Klant "${draft.clientName}" is niet gevonden. Wil je deze klant eerst aanmaken?`,
          };
        }

        logAIStep({ requestId, step: "create_failed", details: { error: result.message } });
        return { success: false, message: result.message || "Er ging iets mis bij het aanmaken van de offerte." };
      }

      default:
        return { success: false, message: "Onbekende actie." };
    }
  } catch (error) {
    logAIStep({ requestId, step: "create_failed", details: { error: String(error) } });
    console.error("[CONVERSATION_MANAGER] Execute action error:", error);
    return { 
      success: false, 
      message: "Er is een onverwachte fout opgetreden. Probeer het opnieuw."
    };
  }
}

/**
 * Main multi-step conversation handler
 * Processes user message and returns appropriate response
 */
export async function handleMultiStepMessage(
  message: string,
  intent: MultiStepIntent,
  userId: string,
  requestId: string
): Promise<{
  requestId: string;
  intent: string;
  type?: string;
  message: string;
  data?: Record<string, unknown>;
  needsMoreInfo?: boolean;
  missingFields?: string[];
  conversationId?: string;
}> {
  // Step 1: Check for active conversation
  let conversation = await getActiveConversation(userId, intent);
  
  if (!conversation) {
    // Step 2: Create new conversation with initial data from message
    const initialDraft = parseMessageForIntent(intent, message, {});
    conversation = await createConversation(userId, intent, initialDraft);
    logAIStep({ requestId, step: "draft_updated", details: { action: "created", draft: initialDraft } });
  } else {
    // Step 3: Update existing conversation with new data
    const updates = parseMessageForIntent(intent, message, conversation.draft);
    if (Object.keys(updates).length > 0) {
      conversation = await updateConversation(
        conversation.conversationId,
        userId,
        updates
      );
      logAIStep({ requestId, step: "draft_updated", details: { action: "updated", updates } });
    }
  }

  // Step 4: Validate the draft
  const { isValid, missingFields } = validateDraft(intent, conversation.draft);

  if (!isValid && missingFields.length > 0) {
    // Step 5: Ask for missing fields
    logAIStep({ requestId, step: "validation_failed", details: { missingFields } });
    const question = getNextQuestion(intent, missingFields);
    
    return {
      requestId,
      intent,
      message: question,
      needsMoreInfo: true,
      missingFields,
      conversationId: conversation.conversationId,
    };
  }

  // Step 6: Draft is valid - execute the action
  const result = await executeAction(intent, conversation.draft, userId, requestId);
  
  if (result.success) {
    // Complete the conversation
    await completeConversation(conversation.conversationId, userId);
  }

  return {
    requestId,
    intent,
    type: result.type,
    message: result.message,
    data: result.data,
    needsMoreInfo: !result.success && !result.data,
    conversationId: conversation.conversationId,
  };
}

/**
 * Check if an intent should use multi-step flow
 */
export function isMultiStepIntent(intent: string): intent is MultiStepIntent {
  return ["create_client", "create_factuur", "create_offerte"].includes(intent);
}
