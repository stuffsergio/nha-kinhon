import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../config/db.js", () => ({
  default: {
    order: { findUnique: vi.fn(), update: vi.fn() },
    refund: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    $transaction: vi.fn((fn) => fn({
      order: { findUnique: vi.fn(), update: vi.fn() },
      refund: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    })),
    stripeProcessedEvent: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("../../../services/stripe.service.js", () => ({
  isStripeConfigured: vi.fn(() => true),
  getStripe: vi.fn(() => ({
    refunds: {
      create: vi.fn().mockResolvedValue({ id: "re_1", status: "succeeded" }),
    },
    checkout: { sessions: { retrieve: vi.fn() } },
  })),
}));

vi.mock("../../../services/notification.service.js", () => ({
  createNotification: vi.fn(),
}));

vi.mock("../../../services/adminNotify.service.js", () => ({
  notifyAllAdmins: vi.fn(),
}));

vi.mock("../../../services/orderEvent.service.js", () => ({
  recordOrderEvent: vi.fn(),
}));

vi.mock("../../../services/adminAudit.service.js", () => ({
  logAdminAction: vi.fn(),
}));

import prisma from "../../../config/db.js";
import { createBuyerRefundRequest } from "../../../services/refund.service.js";

describe("refund.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates buyer refund request when eligible", async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: "order-1",
      userId: "u1",
      total: 5000,
      status: "UNDELIVERABLE",
      items: [],
      refunds: [],
    });
    prisma.refund.create.mockResolvedValue({
      id: "ref-1",
      orderId: "order-1",
      amount: 5000,
      status: "PENDING",
    });

    const refund = await createBuyerRefundRequest({
      orderId: "order-1",
      userId: "u1",
      reason: "UNDELIVERABLE",
    });

    expect(refund.id).toBe("ref-1");
    expect(prisma.refund.create).toHaveBeenCalled();
  });
});
