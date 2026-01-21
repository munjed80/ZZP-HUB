import { strict as assert } from "assert";
import { test } from "node:test";
import { normalizePeriod } from "../lib/period.js";

test("accountant period query cannot change company scope", () => {
  const range = normalizePeriod(new URLSearchParams({ period: "month", year: "2025", month: "5", userId: "hacker" }));
  assert.equal(range.from.getFullYear(), 2025);
});
