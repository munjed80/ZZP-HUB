import { NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth/tenant";
import { IntentSchema } from "@/lib/ai/schemas/drafts";
import { generateRequestId, logAIStep } from "@/lib/ai/audit";

/**
 * POST /api/ai/intent
 * Classify user intent for a message
 */
export async function POST(request: Request) {
  const requestId = generateRequestId();
  
  try {
    // Get authenticated user context
    const { userId } = await requireTenantContext();

    // Parse request body
    const body = await request.json().catch(() => null);
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { error: "Geen bericht ontvangen." },
        { status: 400 }
      );
    }

    // Simple intent detection
    const normalized = message.toLowerCase();
    let intent: string = "unknown";
    let confidence = 0.5;

    if (normalized.includes("factuur") || normalized.includes("invoice")) {
      intent = "create_factuur";
      confidence = 0.9;
    } else if (normalized.includes("offerte") || normalized.includes("quote")) {
      intent = "create_offerte";
      confidence = 0.9;
    } else if (normalized.includes("uitgave") || normalized.includes("expense")) {
      intent = "create_uitgave";
      confidence = 0.9;
    } else if (normalized.includes("klant") || normalized.includes("relatie") || normalized.includes("client")) {
      intent = "create_client";
      confidence = 0.8;
    } else if (normalized.includes("btw") || normalized.includes("vat")) {
      intent = "compute_btw";
      confidence = 0.8;
    } else if (normalized.includes("toon") || normalized.includes("show") || normalized.includes("lijst")) {
      intent = "query_invoices";
      confidence = 0.7;
    } else {
      intent = "help_question";
      confidence = 0.6;
    }

    // Validate with schema
    const validated = IntentSchema.parse({ intent, confidence });

    logAIStep({ requestId, step: "intent_detected", details: { intent, confidence } });

    return NextResponse.json({
      requestId,
      intent: validated.intent,
      confidence: validated.confidence,
    });
  } catch (error: unknown) {
    console.error("[AI_INTENT_ERROR]", { requestId, error });

    return NextResponse.json(
      { 
        error: "Er is een fout opgetreden bij intent classificatie.",
        requestId,
      },
      { status: 500 }
    );
  }
}
