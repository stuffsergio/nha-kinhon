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
import {
  parseDeliveryFailedIdempotencyKey,
  withDeliveryFailedAttemptIdempotency,
} from "../../../utils/deliveryFailedIdempotency.js";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("deliveryFailedIdempotency", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires UUID header", () => {
    expect(() => parseDeliveryFailedIdempotencyKey(undefined)).toThrow();
    expect(() => parseDeliveryFailedIdempotencyKey("not-a-uuid")).toThrow();
    expect(parseDeliveryFailedIdempotencyKey(UUID)).toBe(UUID.toLowerCase());
  });

  it("replays stored response without running handler", async () => {
    prisma.requestIdempotency.findUnique.mockResolvedValue({
      responseBody: { status: "UNDELIVERABLE" },
    });

    const run = vi.fn();
    const { responseBody, replayed } = await withDeliveryFailedAttemptIdempotency({
      key: UUID,
      courierId: "courier-1",
      orderId: "order-1",
      run,
    });

    expect(replayed).toBe(true);
    expect(responseBody).toEqual({ status: "UNDELIVERABLE" });
    expect(run).not.toHaveBeenCalled();
  });
});
