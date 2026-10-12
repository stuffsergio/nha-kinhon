import { describe, it, expect } from "vitest";
import {
  formatDeliveryAttemptForCourier,
  formatDeliveryOrder,
} from "../../../utils/deliveryOrders.js";

describe("formatDeliveryOrder failedAttempts", () => {
  it("includes failedAttempts for courier payload", () => {
    const order = {
      id: "o1",
      status: "DELIVERY_FAILED_ATTEMPT",
      total: 1000,
      recipientName: "Ana",
      recipientPhone: "123",
      recipientAddress: "Rua 1",
      createdAt: new Date("2026-10-12T10:00:00.000Z"),
      items: [],
      deliveryAttempts: [
        {
          attemptNumber: 1,
          reason: "RECIPIENT_ABSENT",
          note: "Nadie",
          createdAt: new Date("2026-10-12T11:00:00.000Z"),
          photos: [{ url: "data:image/jpeg;base64,abc" }],
        },
      ],
    };

    const formatted = formatDeliveryOrder(order);
    expect(formatted.failedAttempts).toHaveLength(1);
    expect(formatted.failedAttempts[0]).toEqual({
      attemptNumber: 1,
      reason: "RECIPIENT_ABSENT",
      note: "Nadie",
      photos: [{ url: "data:image/jpeg;base64,abc" }],
      createdAt: order.deliveryAttempts[0].createdAt,
    });
  });

  it("formatDeliveryAttemptForCourier shapes photos as url only", () => {
    const row = formatDeliveryAttemptForCourier({
      attemptNumber: 2,
      reason: "WRONG_ADDRESS",
      note: null,
      createdAt: "2026-10-12T12:00:00.000Z",
      photos: [{ url: "x", id: "ignore" }],
    });
    expect(row.photos).toEqual([{ url: "x" }]);
  });
});
