import { NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth/tenant";
import { completeDraft } from "@/lib/ai/draft-state";
import { generateRequestId, logAIStep, logAIAction } from "@/lib/ai/audit";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/ai/draft/confirm
 * Confirm and execute a draft (create the actual entity)
 */
export async function POST(request: Request) {
  const requestId = generateRequestId();
  
  try {
    // Get authenticated user context
    const { userId } = await requireTenantContext();

    // Parse request body
    const body = await request.json().catch(() => null);
    const conversationId = typeof body?.conversationId === "string" ? body.conversationId : null;

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is verplicht." },
        { status: 400 }
      );
    }

    // Get draft
    const draft = await prisma.conversationDraft.findUnique({
      where: { conversationId },
    });

    if (!draft) {
      return NextResponse.json(
        { error: "Draft niet gevonden." },
        { status: 404 }
      );
    }

    if (draft.userId !== userId) {
      return NextResponse.json(
        { error: "Geen toegang tot deze draft." },
        { status: 403 }
      );
    }

    // Mark draft as confirmed
    await completeDraft({ conversationId, userId });

    logAIStep({ 
      requestId, 
      step: "create_success", 
      details: { conversationId, intent: draft.intent } 
    });

    // Log action
    await logAIAction({
      userId,
      actionType: "draft_confirmed",
      payload: { conversationId, intent: draft.intent },
      requestId,
      status: "confirmed",
      success: true,
    });

    return NextResponse.json({
      requestId,
      success: true,
      message: "Draft bevestigd en verwerkt.",
    });
  } catch (error: unknown) {
    console.error("[AI_DRAFT_CONFIRM_ERROR]", { requestId, error });

    const errorMessage = error instanceof Error ? error.message : String(error);

    logAIStep({ 
      requestId, 
      step: "create_failed", 
      details: { error: errorMessage } 
    });

    return NextResponse.json(
      { 
        error: errorMessage,
        requestId,
      },
      { status: 500 }
    );
  }
}
