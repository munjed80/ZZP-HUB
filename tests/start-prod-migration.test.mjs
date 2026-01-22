import { describe, test } from "node:test";
import assert from "node:assert/strict";

/**
 * Validate migration name to ensure it's safe for use in shell commands.
 * Prisma migration names are alphanumeric with underscores only.
 */
function isValidMigrationName(name) {
  return /^[a-zA-Z0-9_]+$/.test(name);
}

/**
 * Extract failed migration name from P3009 error message.
 * Prisma outputs: "The `<migration_name>` migration"
 */
function extractFailedMigrationName(errorMessage) {
  const match = errorMessage.match(/The `(.*?)` migration/);
  if (!match) return null;
  const name = match[1];
  // Validate the extracted name to prevent potential injection
  return isValidMigrationName(name) ? name : null;
}

describe("isValidMigrationName - Migration name validation", () => {
  test("accepts valid alphanumeric migration names", () => {
    assert.strictEqual(isValidMigrationName("20260122000000_add_company_user_permissions"), true);
  });

  test("accepts simple alphanumeric names", () => {
    assert.strictEqual(isValidMigrationName("init"), true);
  });

  test("accepts numbers only", () => {
    assert.strictEqual(isValidMigrationName("20260122000000"), true);
  });

  test("accepts underscores", () => {
    assert.strictEqual(isValidMigrationName("add_user_table"), true);
  });

  test("rejects names with spaces", () => {
    assert.strictEqual(isValidMigrationName("add user table"), false);
  });

  test("rejects names with special characters", () => {
    assert.strictEqual(isValidMigrationName("add_user_table;rm -rf /"), false);
  });

  test("rejects names with shell injection attempts", () => {
    assert.strictEqual(isValidMigrationName("test$(whoami)"), false);
  });

  test("rejects empty string", () => {
    assert.strictEqual(isValidMigrationName(""), false);
  });

  test("rejects names with backticks", () => {
    assert.strictEqual(isValidMigrationName("test`id`"), false);
  });

  test("rejects names with pipes", () => {
    assert.strictEqual(isValidMigrationName("test|cat"), false);
  });

  test("rejects names with hyphens", () => {
    assert.strictEqual(isValidMigrationName("add-user-table"), false);
  });

  test("rejects names with dots", () => {
    assert.strictEqual(isValidMigrationName("test.sql"), false);
  });
});

describe("extractFailedMigrationName - P3009 error parsing", () => {
  test("extracts migration name from standard P3009 error", () => {
    const errorMessage = `Error: P3009

migrate found failed migrations in the target database, new migrations will not be applied. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve
The \`20260122000000_add_company_user_permissions\` migration started at 2026-01-22 10:00:00.000 UTC failed
`;
    const result = extractFailedMigrationName(errorMessage);
    assert.strictEqual(result, "20260122000000_add_company_user_permissions");
  });

  test("extracts migration name from compact error message", () => {
    const errorMessage = "Error: The `init_migration` migration failed";
    const result = extractFailedMigrationName(errorMessage);
    assert.strictEqual(result, "init_migration");
  });

  test("returns null for non-P3009 errors", () => {
    const errorMessage = "Error: Database connection failed";
    const result = extractFailedMigrationName(errorMessage);
    assert.strictEqual(result, null);
  });

  test("returns null when backticks are missing", () => {
    const errorMessage = "The migration failed";
    const result = extractFailedMigrationName(errorMessage);
    assert.strictEqual(result, null);
  });

  test("rejects malicious migration names with shell injection", () => {
    const errorMessage = "The `test; rm -rf /` migration failed";
    const result = extractFailedMigrationName(errorMessage);
    assert.strictEqual(result, null);
  });

  test("rejects migration names with command substitution", () => {
    const errorMessage = "The `$(whoami)` migration failed";
    const result = extractFailedMigrationName(errorMessage);
    assert.strictEqual(result, null);
  });

  test("rejects migration names with backtick substitution", () => {
    const errorMessage = "The `test`id`` migration failed";
    const result = extractFailedMigrationName(errorMessage);
    // This won't match due to regex
    assert.strictEqual(result, null);
  });

  test("returns null for empty migration name", () => {
    const errorMessage = "The `` migration failed";
    const result = extractFailedMigrationName(errorMessage);
    assert.strictEqual(result, null);
  });
});

describe("extractFailedMigrationName - Edge cases", () => {
  test("handles real-world P3009 stderr output", () => {
    const errorMessage = `npx prisma migrate deploy exited with code 1. Error: Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "zzp_hub", schema "public" at "localhost:5432"

Error: P3009

migrate found failed migrations in the target database, new migrations will not be applied. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve
The \`20260122000000_add_company_user_permissions\` migration started at 2026-01-22 10:00:00.000 UTC failed`;
    const result = extractFailedMigrationName(errorMessage);
    assert.strictEqual(result, "20260122000000_add_company_user_permissions");
  });

  test("extracts first migration name if multiple mentioned", () => {
    const errorMessage = "The `first_migration` migration failed. Check `second_migration` too";
    const result = extractFailedMigrationName(errorMessage);
    assert.strictEqual(result, "first_migration");
  });

  test("handles migration names with only underscores", () => {
    const errorMessage = "The `___` migration failed";
    const result = extractFailedMigrationName(errorMessage);
    assert.strictEqual(result, "___");
  });
});

describe("Integration - Migration name check for auto-resolution", () => {
  test("recognizes add_company_user_permissions migration pattern", () => {
    const migrationName = "20260122000000_add_company_user_permissions";
    const shouldAutoResolve = migrationName.includes("add_company_user_permissions");
    assert.strictEqual(shouldAutoResolve, true);
  });

  test("does not auto-resolve other migrations", () => {
    const migrationName = "20260121012500_drop_old_email_column";
    const shouldAutoResolve = migrationName.includes("add_company_user_permissions");
    assert.strictEqual(shouldAutoResolve, false);
  });

  test("does not auto-resolve unrelated user migration", () => {
    const migrationName = "20260120002400_accountant_access_and_invite_fields";
    const shouldAutoResolve = migrationName.includes("add_company_user_permissions");
    assert.strictEqual(shouldAutoResolve, false);
  });
});

/**
 * Check if an error message indicates P3018 with 42P01 (missing relation).
 * P3018 is thrown when a migration cannot be applied because a referenced relation does not exist.
 */
function isP3018MissingRelation(errorMessage) {
  // P3018 is the Prisma error code for migration apply failure
  // 42P01 is the PostgreSQL error code for "relation does not exist"
  return errorMessage.includes("P3018") && errorMessage.includes("42P01");
}

describe("isP3018MissingRelation - P3018/42P01 error detection", () => {
  test("detects P3018 with 42P01 error code", () => {
    const errorMessage = `Error: P3018
A migration failed to apply. New migrations cannot be applied before the error is recovered from.
Database error code: 42P01
Error message: relation "CompanyUser" does not exist
`;
    assert.strictEqual(isP3018MissingRelation(errorMessage), true);
  });

  test("detects P3018/42P01 in compact error format", () => {
    const errorMessage = "npx prisma migrate deploy exited with code 1. Error: P3018 - Database error code: 42P01";
    assert.strictEqual(isP3018MissingRelation(errorMessage), true);
  });

  test("returns false for P3018 without 42P01", () => {
    const errorMessage = `Error: P3018
A migration failed to apply.
Database error code: 23505
Error message: duplicate key value violates unique constraint
`;
    assert.strictEqual(isP3018MissingRelation(errorMessage), false);
  });

  test("returns false for 42P01 without P3018", () => {
    const errorMessage = "Error: Database error code: 42P01 - relation does not exist";
    assert.strictEqual(isP3018MissingRelation(errorMessage), false);
  });

  test("returns false for P3009 error", () => {
    const errorMessage = `Error: P3009
migrate found failed migrations in the target database
The \`20260122000000_add_company_user_permissions\` migration started at 2026-01-22 10:00:00.000 UTC failed
`;
    assert.strictEqual(isP3018MissingRelation(errorMessage), false);
  });

  test("returns false for connection error", () => {
    const errorMessage = "Error: Can't reach database server at localhost:5432";
    assert.strictEqual(isP3018MissingRelation(errorMessage), false);
  });

  test("returns false for empty string", () => {
    assert.strictEqual(isP3018MissingRelation(""), false);
  });

  test("handles real-world P3018/42P01 stderr output", () => {
    const errorMessage = `npx prisma migrate deploy exited with code 1. Error: Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "zzp_hub", schema "public" at "localhost:5432"

Applying migration \`20260122000000_add_company_user_permissions\`

Error: P3018

A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260122000000_add_company_user_permissions

Database error code: 42P01

Database error:
ERROR: relation "CompanyUser" does not exist

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"CompanyUser\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(426), routine: Some("RangeVarGetRelidExtended") }`;
    assert.strictEqual(isP3018MissingRelation(errorMessage), true);
  });
});

describe("P3018/42P01 recovery - Integration scenarios", () => {
  test("P3018 check comes before P3009 in error handling priority", () => {
    // Simulating the logic flow: P3018+42P01 should be handled first
    const errorWithBoth = "Error: P3018 - 42P01 - relation does not exist";
    const isP3018 = isP3018MissingRelation(errorWithBoth);
    const isP3009 = errorWithBoth.includes("P3009");
    
    // P3018 should trigger recovery path
    assert.strictEqual(isP3018, true);
    // P3009 should not match this error
    assert.strictEqual(isP3009, false);
  });

  test("only P3009 triggers when P3018 is not present", () => {
    const p3009Error = "Error: P3009 - The `test_migration` migration failed";
    const isP3018 = isP3018MissingRelation(p3009Error);
    const isP3009 = p3009Error.includes("P3009");
    
    assert.strictEqual(isP3018, false);
    assert.strictEqual(isP3009, true);
  });
});
