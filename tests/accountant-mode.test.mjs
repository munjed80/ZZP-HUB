import { strict as assert } from "assert";
import { test } from "node:test";
import AccountantMode from "../app/(dashboard)/dashboard/accountant-mode.js";

test("accountant mode renders safely with empty data", async () => {
  const element = await AccountantMode({ searchParams: Promise.resolve({}) });
  assert.ok(element === null || typeof element === "object");
});
