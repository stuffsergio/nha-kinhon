import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../config/db.js", () => ({
  default: {
    requestIdempotency: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import prisma from "../../../config/db.js";
import { parseIdempotencyKey, withIdempotency } from "../../../utils/requestIdempotency.js";

describe("requestIdempotency", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects malformed keys", () => {
    expect(() => parseIdempotencyKey("short")).toThrow();
  });

  it("returns cached response for same actor", async () => {
    prisma.requestIdempotency.findUnique.mockResolvedValue({
      actorId: "u1",
      responseBody: { ok: true },
    });

    const out = await withIdempotency({
      scope: "delivery_failed_attempt",
      key: "mobile-key-12345678",
      actorId: "u1",
      orderId: "order-1",
      run: async () => ({ ok: false }),
    });

    expect(out).toEqual({ ok: true });
  });
});
