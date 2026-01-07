import { PrismaClient } from "@prisma/client";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const REQUIRED_ENV = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "RESEND_API_KEY",
];

function validateEnv() {
  const missing = REQUIRED_ENV.filter(
    (key) => !process.env[key] || process.env[key].trim() === "",
  );

  if (missing.length > 0) {
    console.error(
      `[start-prod] Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }

  const baseUrl =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BASE_URL ??
    process.env.NEXTAUTH_URL;

  if (!baseUrl) {
    console.error(
      "[start-prod] Missing application URL. Set APP_URL or NEXT_PUBLIC_APP_URL (NEXTAUTH_URL is used as fallback).",
    );
    process.exit(1);
  }
}

async function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: false });
    child.on("exit", (code) => {
      if (code === 0) return resolve(undefined);
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

async function verifyDatabase() {
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("[start-prod] Database connectivity check: OK");
  } catch (error) {
    console.error("[start-prod] Database connectivity check failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function startServer() {
  const serverPath = path.join(process.cwd(), ".next", "standalone", "server.js");
  if (!fs.existsSync(serverPath)) {
    console.error(
      `[start-prod] Build output not found at ${serverPath}. Run "npm run build" before starting.`,
    );
    process.exit(1);
  }

  const host = process.env.HOST || "0.0.0.0";
  const port = process.env.PORT || "3000";

  console.log(`[start-prod] Starting server on ${host}:${port}`);

  const child = spawn("node", [serverPath], {
    stdio: "inherit",
    env: { ...process.env, HOST: host, PORT: port },
  });

  child.on("exit", (code) => {
    process.exit(code ?? 1);
  });

  child.on("error", (error) => {
    console.error("[start-prod] Failed to start server:", error);
    process.exit(1);
  });
}

async function main() {
  validateEnv();

  console.log("[start-prod] Running prisma migrate deploy");
  await runCommand("npx", ["prisma", "migrate", "deploy"]);

  console.log("[start-prod] Running prisma generate");
  await runCommand("npx", ["prisma", "generate"]);

  await verifyDatabase();
  await startServer();
}

main().catch((error) => {
  console.error("[start-prod] Fatal error:", error);
  process.exit(1);
});
