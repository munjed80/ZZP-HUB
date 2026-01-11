import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const REQUIRED_ENV = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
];
const OPTIONAL_ENV = [
  "RESEND_API_KEY",
];
const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = "3000";
const FAILED_MIGRATION_ID = "20260107172021_add_onboarding_and_email_verification";

function getErrorMessage(error, fallback = "[unknown error]") {
  return error instanceof Error ? error.message : fallback;
}

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

  // Check optional env vars and warn if missing
  const missingOptional = OPTIONAL_ENV.filter(
    (key) => !process.env[key] || process.env[key].trim() === "",
  );

  if (missingOptional.length > 0) {
    console.warn(
      `[start-prod] WARNING: Missing optional environment variables: ${missingOptional.join(", ")}`,
    );
    console.warn(
      "[start-prod] Email functionality will be disabled. Email verification and notifications will not work.",
    );
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
    let stderr = "";
    let stdout = "";
    const child = spawn(command, args, {
      stdio: ["inherit", "pipe", "pipe"],
      shell: false,
    });

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
      process.stdout.write(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });
    child.on("exit", (code) => {
      if (code === 0) return resolve(undefined);
      reject(
        new Error(
          `${command} ${args.join(" ")} exited with code ${code}. ${stderr ? `Error: ${stderr.trim()}` : ""}`,
        ),
      );
    });
    child.on("error", (error) => {
      reject(new Error(`Failed to start ${command}: ${error.message}`));
    });
  });
}

async function startServer() {
  const serverPath = path.join(process.cwd(), ".next", "standalone", "server.js");
  if (!fs.existsSync(serverPath)) {
    console.error(
      `[start-prod] Build output not found at ${serverPath}. Run "npm run build" before starting.`,
    );
    process.exit(1);
  }

  // Force binding to all interfaces for containerized deployments (e.g., Coolify).
  const host = DEFAULT_HOST;
  const port = DEFAULT_PORT;
  const { HOSTNAME: _ignoredHostname, ...passthroughEnv } = process.env;
  // Do not forward HOSTNAME in standalone mode or Next.js will bind to the container hostname instead of 0.0.0.0.
  const serverEnv = { ...passthroughEnv, HOST: host, PORT: port };

  console.log(`[start-prod] Starting server on ${host}:${port}`);

  const child = spawn("node", [serverPath], {
    stdio: "inherit",
    env: serverEnv,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 1);
  });

  child.on("error", (error) => {
    console.error("[start-prod] Failed to start server:", error);
    process.exit(1);
  });
}

async function migrateDeployWithFallback() {
  try {
    console.log("[start-prod] Running prisma migrate deploy");
    await runCommand("./node_modules/.bin/prisma", ["migrate", "deploy"]);
    console.log("[start-prod] Prisma migrate deploy completed");
    return;
  } catch (error) {
    const message = getErrorMessage(error, "[unknown migrate error]");

    if (!message.includes("P3009")) {
      throw error;
    }

    console.warn(
      `[start-prod] Prisma migrate failed with P3009 (migration already applied or history out of sync). Marking ${FAILED_MIGRATION_ID} as applied and retrying.`,
    );

    await runCommand("./node_modules/.bin/prisma", [
      "migrate",
      "resolve",
      "--applied",
      FAILED_MIGRATION_ID,
    ]);

    console.log("[start-prod] Retrying prisma migrate deploy after resolving");
    try {
      await runCommand("./node_modules/.bin/prisma", ["migrate", "deploy"]);
      console.log("[start-prod] Prisma migrate deploy completed after resolve");
    } catch (retryError) {
      const retryMessage = getErrorMessage(
        retryError,
        "[unknown migrate retry error]",
      );
      throw new Error(
        `[start-prod] Prisma migrate deploy failed after resolving P3009 (migration history may still be out of sync). Inspect the database_migrations table and rerun prisma migrate resolve/deploy manually. Details: ${retryMessage}`,
      );
    }
  }
}

async function main() {
  validateEnv();

  await migrateDeployWithFallback();

  // Bootstrap SUPERADMIN user after migrations
  console.log("[start-prod] Bootstrapping SUPERADMIN user");
  try {
    await runCommand("node", ["./scripts/bootstrap-superadmin.mjs"]);
  } catch (error) {
    console.warn("[start-prod] SUPERADMIN bootstrap failed, continuing anyway:", error.message);
    // Don't fail the startup if bootstrap fails - the server should still start
  }

  // Prisma client is generated during the image build (npm install/next build), so runtime only applies migrations before starting the server.
  await startServer();
}

main()
  .catch((error) => {
    console.error("[start-prod] Fatal error:", error);
    process.exit(1);
  });
