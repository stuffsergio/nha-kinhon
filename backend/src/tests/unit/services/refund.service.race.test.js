import { describe, it, expect, vi, beforeEach } from "vitest";

const txMocks = vi.hoisted(() => ({
  executeRaw: vi.fn(),
  orderFindUnique: vi.fn(),
  refundCreate: vi.fn(),
  refundFindUnique: vi.fn(),
  refundUpdate: vi.fn(),
}));

vi.mock("../../../config/db.js", () => ({
  default: {
    $transaction: vi.fn(async (fn) =>
      fn({
        $executeRaw: txMocks.executeRaw,
        order: { findUnique: txMocks.orderFindUnique },
        refund: {
          create: txMocks.refundCreate,
          findUnique: txMocks.refundFindUnique,
          update: txMocks.refundUpdate,
        },
      }),
    ),
    refund: { findUnique: vi.fn() },
    order: { findUnique: vi.fn() },
  },
}));

vi.mock("../../../services/stripe.service.js", () => ({
  isStripeConfigured: vi.fn(() => false),
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

import { createAdminManualRefund } from "../../../services/refund.service.js";

describe("refund.service concurrency guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    txMocks.orderFindUnique.mockResolvedValue({
      id: "o1",
      total: 10000,
      status: "DELIVERED",
      deliveredAt: new Date(),
      items: [],
      refunds: [{ id: "r0", status: "SUCCEEDED", amount: 9000 }],
    });
  });

  it("rejects manual refund when remaining is insufficient under lock", async () => {
    await expect(
      createAdminManualRefund({
        orderId: "o1",
        adminId: "a1",
        amountFcfa: 2000,
        reason: "ADMIN_MANUAL",
      }),
    ).rejects.toMatchObject({ code: "REFUND_AMOUNT_INVALID" });

    expect(txMocks.executeRaw).toHaveBeenCalled();
    expect(txMocks.refundCreate).not.toHaveBeenCalled();
  });
});
