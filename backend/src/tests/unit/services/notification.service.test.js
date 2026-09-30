import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../config/db.js", () => ({
  default: {
    notification: { create: vi.fn() },
    pushToken: { findMany: vi.fn(), deleteMany: vi.fn() },
  },
}));

import prisma from "../../../config/db.js";
import { createNotification } from "../../../services/notification.service.js";

describe("notification.service createNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
  });

  it("sends push data with order tracking deep links", async () => {
    prisma.notification.create.mockResolvedValue({
      id: "notif-1",
      userId: "user-1",
      type: "ORDER_IN_TRANSIT",
    });
    prisma.pushToken.findMany.mockResolvedValue([{ token: "ExponentPushToken[abc]" }]);

    await createNotification({
      userId: "user-1",
      type: "ORDER_IN_TRANSIT",
      title: "En camino",
      message: "Tu pedido va en camino",
      orderId: "order-99",
    });

    expect(global.fetch).toHaveBeenCalled();
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body[0].data.orderId).toBe("order-99");
    expect(body[0].data.route).toBe("/pedido/order-99");
    expect(body[0].data.url).toBe("/perfil?tab=orders&orderId=order-99");
    expect(body[0].data.screen).toBe("order_tracking");
  });
});
