import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../config/db.js", () => ({
  default: {
    order: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("../../../services/notification.service.js", () => ({
  createNotification: vi.fn(),
}));

import prisma from "../../../config/db.js";
import { createNotification } from "../../../services/notification.service.js";
import { checkAndNotifyCourierNearby } from "../../../services/deliveryProximity.service.js";

describe("deliveryProximity.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("notifies buyer once when courier is within threshold", async () => {
    prisma.order.findMany.mockResolvedValue([
      {
        id: "order-1",
        userId: "buyer-1",
        recipientLat: 11.863,
        recipientLng: -15.598,
      },
    ]);
    prisma.order.updateMany.mockResolvedValue({ count: 1 });

    await checkAndNotifyCourierNearby("delivery-1", 11.8631, -15.5981);

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "buyer-1",
        type: "ORDER_COURIER_NEARBY",
        orderId: "order-1",
      }),
    );
  });

  it("skips notification when courier is far away", async () => {
    prisma.order.findMany.mockResolvedValue([
      {
        id: "order-1",
        userId: "buyer-1",
        recipientLat: 11.0,
        recipientLng: -15.0,
      },
    ]);

    await checkAndNotifyCourierNearby("delivery-1", 11.863, -15.598);

    expect(createNotification).not.toHaveBeenCalled();
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
  });
});
