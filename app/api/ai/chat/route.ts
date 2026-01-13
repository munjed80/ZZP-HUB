import { NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth/tenant";
import { routeAIRequest } from "@/lib/ai/router";
import { logAIAction } from "@/lib/ai/audit";

export async function POST(request: Request) {
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

    // Route the request through AI router
    const result = await routeAIRequest(message, { userId });

    // Log the action for audit
    await logAIAction({
      userId,
      actionType: result.type || result.intent,
      payload: { message },
      resultId: result.data?.invoice?.id || result.data?.quotation?.id,
      resultType: result.type,
      success: result.intent !== "unknown",
      errorMessage: result.intent === "unknown" ? result.message : undefined,
    });

    return NextResponse.json({
      intent: result.intent,
      type: result.type,
      data: result.data,
      message: result.message,
      needsConfirmation: result.needsConfirmation,
      needsMoreInfo: result.needsMoreInfo,
      missingFields: result.missingFields,
      citations: result.citations,
    });
  } catch (error: unknown) {
    console.error("AI chat error:", error);

    // Handle authentication errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage?.includes("Niet geauthenticeerd")) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om AI Assist te gebruiken." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Er is een fout opgetreden. Probeer het later opnieuw." },
      { status: 500 }
    );
  }
}
