import process from "node:process";

const baseUrl =
  process.env.SMOKE_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  `http://localhost:${process.env.PORT || 3000}`;

const routes = ["/", "/api/health", "/sw.js", "/manifest.webmanifest"];

async function check(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Status ${res.status}`);
    }
    console.log(`[smoke] OK ${url}`);
  } catch (error) {
    console.error(`[smoke] FAIL ${url}:`, error.message);
    process.exitCode = 1;
  }
}

async function main() {
  console.log(`[smoke] Checking base URL: ${baseUrl}`);
  for (const route of routes) {
    await check(`${baseUrl}${route}`);
  }
}

main().catch((error) => {
  console.error("[smoke] Fatal error:", error);
  process.exitCode = 1;
});
