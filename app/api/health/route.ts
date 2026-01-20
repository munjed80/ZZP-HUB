import { NextResponse } from "next/server";

export async function GET() {
  const payload = {
    status: "ok",
    ts: Date.now(),
  };

  console.log("[HEALTHCHECK_OK]", payload);

  return NextResponse.json(payload, { status: 200 });
}
