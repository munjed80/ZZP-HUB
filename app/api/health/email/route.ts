import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Email health check endpoint
 * Validates that RESEND_API_KEY is configured
 * Does NOT expose the actual key value
 */
export async function GET() {
  try {
    const hasApiKey = Boolean(process.env.RESEND_API_KEY);
    
    if (!hasApiKey) {
      return NextResponse.json(
        { 
          status: "error", 
          email: "not_configured",
          message: "RESEND_API_KEY is not set"
        },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    // API key exists - we consider this "ok"
    // We don't actually test sending to avoid rate limits
    return NextResponse.json(
      { 
        status: "ok", 
        email: "configured",
        message: "RESEND_API_KEY is set"
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("[health/email] Check failed:", error);
    return NextResponse.json(
      { 
        status: "error", 
        email: "error",
        message: "Health check failed"
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
