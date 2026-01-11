import { test } from "node:test";
import assert from "node:assert/strict";
import { SupportMessageStatus } from "@prisma/client";

test("SupportMessageStatus exposes expected values", () => {
  assert.deepStrictEqual(
    [
      SupportMessageStatus.NEW,
      SupportMessageStatus.READ,
      SupportMessageStatus.CLOSED,
    ],
    ["NEW", "READ", "CLOSED"],
  );
});
