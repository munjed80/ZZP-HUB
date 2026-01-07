import process from "node:process";

const baseUrl =
  process.env.SMOKE_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  `http://localhost:${process.env.PORT || 3000}`;

const routes = ["/", "/api/health", "/sw.js", "/manifest.webmanifest"];
const parsedTimeout = Number.parseInt(process.env.SMOKE_TIMEOUT_MS ?? "", 10);
const TIMEOUT_MS = Number.isFinite(parsedTimeout) ? parsedTimeout : 10000;

async function check(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { "User-Agent": "smoke-test/1.0" },
    });
    if (!res.ok) {
      throw new Error(`Status ${res.status}`);
    }
    console.log(`[smoke] OK ${url}`);
  } catch (error) {
    console.error(`[smoke] FAIL ${url}:`, error.message);
    process.exitCode = 1;
  } finally {
    clearTimeout(timeoutId);
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
