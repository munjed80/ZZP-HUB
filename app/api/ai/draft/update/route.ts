import { NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth/tenant";
import { updateDraft, getOrCreateDraft } from "@/lib/ai/draft-state";
import { generateRequestId, logAIStep } from "@/lib/ai/audit";

/**
 * POST /api/ai/draft/update
 * Update conversation draft with new fields
 */
export async function POST(request: Request) {
  const requestId = generateRequestId();
  
  try {
    // Get authenticated user context
    const { userId } = await requireTenantContext();

    // Parse request body
    const body = await request.json().catch(() => null);
    const conversationId = typeof body?.conversationId === "string" ? body.conversationId : null;
    const intent = typeof body?.intent === "string" ? body.intent : null;
    const draftUpdates = typeof body?.draftUpdates === "object" ? body.draftUpdates : null;

    if (!conversationId || !draftUpdates) {
      return NextResponse.json(
        { error: "conversationId en draftUpdates zijn verplicht." },
        { status: 400 }
      );
    }

    // Get or create draft
    let draft;
    if (intent) {
      draft = await getOrCreateDraft({ conversationId, userId, intent });
    }

    // Update draft
    const updated = await updateDraft({
      conversationId,
      userId,
      draftUpdates,
      status: body?.status,
    });

    logAIStep({ 
      requestId, 
      step: "draft_updated", 
      details: { conversationId, fieldsUpdated: Object.keys(draftUpdates) } 
    });

    return NextResponse.json({
      requestId,
      success: true,
      draft: updated,
    });
  } catch (error: unknown) {
    console.error("[AI_DRAFT_UPDATE_ERROR]", { requestId, error });

    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      { 
        error: errorMessage,
        requestId,
      },
      { status: 500 }
    );
  }
}
