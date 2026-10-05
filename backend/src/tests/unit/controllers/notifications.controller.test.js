import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../config/db.js", () => ({
  default: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import prisma from "../../../config/db.js";
import * as notificationsController from "../../../controllers/notifications.controller.js";

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe("notifications controller list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns notifications with orderId and deep link fields", async () => {
    const createdAt = new Date("2026-06-01T12:00:00.000Z");
    prisma.notification.findMany.mockResolvedValue([
      {
        id: "notif-1",
        userId: "user-1",
        type: "ORDER_IN_TRANSIT",
        title: "En camino",
        message: "Tu pedido va en camino",
        orderId: "order-42",
        read: false,
        createdAt,
      },
    ]);
    prisma.notification.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

    const req = { user: { id: "user-1" }, query: {} };
    const res = mockRes();

    await notificationsController.list(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            id: "notif-1",
            orderId: "order-42",
            screen: "order_tracking",
            route: "/pedido/order-42",
            url: "/perfil?tab=orders&orderId=order-42",
          }),
        ],
        total: 1,
        unreadCount: 1,
      }),
    );
  });
});
