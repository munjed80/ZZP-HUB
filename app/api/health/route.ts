import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  // SAFE START: Return OK immediately without DB check to allow container to start
  // This bypasses database connectivity checks during startup to enable terminal access for debugging
  return NextResponse.json(
    { status: "ok", message: "Safe start mode - DB checks bypassed" },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );

  // Original DB check code (commented out for safe start):
  // try {
  //   await prisma.$queryRawUnsafe("SELECT 1 as ok");
  //   return NextResponse.json(
  //     { status: "ok", database: "up" },
  //     {
  //       status: 200,
  //       headers: {
  //         "Cache-Control": "no-store, max-age=0",
  //       },
  //     }
  //   );
  // } catch (error) {
  //   console.error("[health] Database check failed:", error);
  //   return NextResponse.json(
  //     { status: "error", database: "down" },
  //     {
  //       status: 503,
  //       headers: {
  //         "Cache-Control": "no-store, max-age=0",
  //       },
  //     }
  //   );
  // }
}
