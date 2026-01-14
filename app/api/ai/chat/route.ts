import { NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth/tenant";
import { routeAIRequest } from "@/lib/ai/router";
import { logAIAction, generateRequestId } from "@/lib/ai/audit";

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

    // Route the request through AI router
    const result = await routeAIRequest(message, { userId, requestId });

    // Extract entity IDs safely
    const invoiceId = result.data && typeof result.data === "object" && "invoice" in result.data && 
                      typeof result.data.invoice === "object" && result.data.invoice && "id" in result.data.invoice
                      ? String(result.data.invoice.id) : undefined;
    const quotationId = result.data && typeof result.data === "object" && "quotation" in result.data &&
                        typeof result.data.quotation === "object" && result.data.quotation && "id" in result.data.quotation
                        ? String(result.data.quotation.id) : undefined;
    const expenseId = result.data && typeof result.data === "object" && "expense" in result.data &&
                      typeof result.data.expense === "object" && result.data.expense && "id" in result.data.expense
                      ? String(result.data.expense.id) : undefined;
    const clientId = result.data && typeof result.data === "object" && "client" in result.data &&
                     typeof result.data.client === "object" && result.data.client && "id" in result.data.client
                     ? String(result.data.client.id) : undefined;

    // Log the action for audit
    await logAIAction({
      userId,
      actionType: result.type || result.intent,
      payload: { message },
      requestId: result.requestId,
      resultId: invoiceId || quotationId || expenseId || clientId,
      resultType: result.type,
      entityType: result.type?.replace("create_", ""),
      entityId: invoiceId || quotationId || expenseId || clientId,
      status: result.needsConfirmation ? "preview" : result.needsMoreInfo ? "collecting" : "completed",
      success: result.intent !== "unknown",
      errorMessage: result.intent === "unknown" ? result.message : undefined,
    });

    // Ensure message is always a string
    const responseMessage = typeof result.message === "string" 
      ? result.message 
      : "Uw verzoek is verwerkt.";

    return NextResponse.json({
      requestId: result.requestId,
      intent: result.intent,
      type: result.type,
      data: result.data,
      message: responseMessage,
      needsConfirmation: result.needsConfirmation,
      needsMoreInfo: result.needsMoreInfo,
      missingFields: result.missingFields,
      citations: result.citations,
    });
  } catch (error: unknown) {
    console.error("[AI_ERROR]", { requestId, error });

    // Handle authentication errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage?.includes("Niet geauthenticeerd")) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om AI Assist te gebruiken.", requestId },
        { status: 401 }
      );
    }

    // Log failed action
    try {
      const { userId } = await requireTenantContext().catch(() => ({ userId: "unknown" }));
      await logAIAction({
        userId,
        actionType: "error",
        payload: { error: errorMessage },
        requestId,
        success: false,
        errorMessage,
      });
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json(
      { 
        error: "Er is een fout opgetreden. Probeer het later opnieuw.",
        requestId,
      },
      { status: 500 }
    );
  }
}
