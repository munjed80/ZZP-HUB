import { strict as assert } from "assert";
import { normalizePeriod } from "../lib/period.js";

import { test } from "node:test";

test("month normalization", () => {
  const range = normalizePeriod(new URLSearchParams({ period: "month", year: "2026", month: "2" }));
  assert.equal(range.from.toISOString().startsWith("2026-02-01"), true);
  assert.equal(range.to.toISOString().startsWith("2026-03-01"), true);
});

test("quarter normalization", () => {
  const range = normalizePeriod(new URLSearchParams({ period: "quarter", year: "2025", quarter: "4" }));
  assert.equal(range.from.toISOString().startsWith("2025-10-01"), true);
  assert.equal(range.to.toISOString().startsWith("2026-01-01"), true);
});

test("custom normalization valid", () => {
  const range = normalizePeriod(new URLSearchParams({ period: "custom", from: "2026-01-10", to: "2026-02-05" }));
  assert.equal(range.from.toISOString().startsWith("2026-01-10"), true);
  assert.equal(range.to.toISOString().startsWith("2026-02-05"), true);
});

test("custom normalization fallback when invalid", () => {
  const range = normalizePeriod(new URLSearchParams({ period: "custom", from: "bad", to: "bad" }));
  assert.ok(range.from < range.to);
});
