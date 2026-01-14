import { prisma } from "@/lib/prisma";
import { ConversationStateSchema, type ConversationState } from "./schemas/drafts";
import { z } from "zod";

/**
 * Draft State Machine
 * Manages conversation drafts for multi-step data collection
 */

/**
 * Get or create a conversation draft
 */
export async function getOrCreateDraft(params: {
  conversationId: string;
  userId: string;
  intent: string;
}): Promise<ConversationState> {
  const existing = await prisma.conversationDraft.findUnique({
    where: { conversationId: params.conversationId },
  });

  if (existing && existing.userId === params.userId) {
    return {
      conversationId: existing.conversationId,
      userId: existing.userId,
      intent: existing.intent,
      draft: JSON.parse(existing.draftJson),
      status: existing.status as ConversationState["status"],
      lastUpdated: existing.updatedAt.toISOString(),
    };
  }

  // Create new draft
  const newDraft = await prisma.conversationDraft.create({
    data: {
      conversationId: params.conversationId,
      userId: params.userId,
      intent: params.intent,
      draftJson: JSON.stringify({}),
      status: "collecting",
    },
  });

  return {
    conversationId: newDraft.conversationId,
    userId: newDraft.userId,
    intent: newDraft.intent,
    draft: {},
    status: "collecting",
    lastUpdated: newDraft.updatedAt.toISOString(),
  };
}

/**
 * Update conversation draft with new fields
 */
export async function updateDraft(params: {
  conversationId: string;
  userId: string;
  draftUpdates: Record<string, unknown>;
  status?: ConversationState["status"];
}): Promise<ConversationState> {
  const existing = await prisma.conversationDraft.findUnique({
    where: { conversationId: params.conversationId },
  });

  if (!existing) {
    throw new Error("Conversatie niet gevonden");
  }

  if (existing.userId !== params.userId) {
    throw new Error("Geen toegang tot deze conversatie");
  }

  const currentDraft = JSON.parse(existing.draftJson);
  const updatedDraft = { ...currentDraft, ...params.draftUpdates };

  const updated = await prisma.conversationDraft.update({
    where: { conversationId: params.conversationId },
    data: {
      draftJson: JSON.stringify(updatedDraft),
      status: params.status || existing.status,
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
 * Validate draft against schema and return missing/invalid fields
 */
export function validateDraft(
  draft: Record<string, unknown>,
  schema: z.ZodSchema
): {
  isValid: boolean;
  missingFields: string[];
  validationErrors: string[];
} {
  const result = schema.safeParse(draft);

  if (result.success) {
    return {
      isValid: true,
      missingFields: [],
      validationErrors: [],
    };
  }

  const missingFields: string[] = [];
  const validationErrors: string[] = [];

  result.error.errors.forEach((err) => {
    const field = err.path.join(".");
    if (err.code === "invalid_type" && err.received === "undefined") {
      missingFields.push(field);
    } else {
      validationErrors.push(`${field}: ${err.message}`);
    }
  });

  return {
    isValid: false,
    missingFields,
    validationErrors,
  };
}

/**
 * Get the next best question to ask based on missing fields
 */
export function getNextQuestion(
  intent: string,
  missingFields: string[]
): string | null {
  if (missingFields.length === 0) return null;

  // Priority mapping for different intents
  const fieldQuestions: Record<string, Record<string, string>> = {
    create_factuur: {
      clientName: "Voor welke klant is deze factuur?",
      items: "Welke diensten/producten wil je factureren? (Beschrijf met aantal en prijs)",
      amount: "Wat is het factuurbedrag?",
      dueInDays: "Binnen hoeveel dagen moet de factuur betaald worden?",
      vatRate: "Welk BTW-tarief? (21%, 9%, of 0%)",
    },
    create_offerte: {
      clientName: "Voor welke klant is deze offerte?",
      items: "Welke diensten/producten wil je aanbieden? (Beschrijf met aantal en prijs)",
      amount: "Wat is het offertebedrag?",
      validForDays: "Hoelang is de offerte geldig? (in dagen)",
      vatRate: "Welk BTW-tarief? (21%, 9%, of 0%)",
    },
    create_uitgave: {
      category: "Wat is de categorie van deze uitgave?",
      amount: "Wat is het bedrag van de uitgave?",
      vendor: "Bij welke leverancier?",
      date: "Op welke datum?",
      vatRate: "Welk BTW-tarief? (21%, 9%, of 0%)",
    },
    create_client: {
      name: "Wat is de naam van de klant/relatie?",
      email: "Wat is het e-mailadres?",
      address: "Wat is het adres?",
      city: "In welke stad?",
    },
  };

  const questions = fieldQuestions[intent] || {};
  
  // Return question for first missing field
  for (const field of missingFields) {
    if (questions[field]) {
      return questions[field];
    }
  }

  // Fallback
  return `Ik heb nog de volgende informatie nodig: ${missingFields.join(", ")}`;
}

/**
 * Clear/complete a conversation draft
 */
export async function completeDraft(params: {
  conversationId: string;
  userId: string;
}): Promise<void> {
  await prisma.conversationDraft.updateMany({
    where: {
      conversationId: params.conversationId,
      userId: params.userId,
    },
    data: {
      status: "confirmed",
      updatedAt: new Date(),
    },
  });
}

/**
 * Cancel a conversation draft
 */
export async function cancelDraft(params: {
  conversationId: string;
  userId: string;
}): Promise<void> {
  await prisma.conversationDraft.updateMany({
    where: {
      conversationId: params.conversationId,
      userId: params.userId,
    },
    data: {
      status: "cancelled",
      updatedAt: new Date(),
    },
  });
}

/**
 * Get active draft for user (latest)
 */
export async function getActiveDraft(userId: string): Promise<ConversationState | null> {
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

  return {
    conversationId: draft.conversationId,
    userId: draft.userId,
    intent: draft.intent,
    draft: JSON.parse(draft.draftJson),
    status: draft.status as ConversationState["status"],
    lastUpdated: draft.updatedAt.toISOString(),
  };
}
