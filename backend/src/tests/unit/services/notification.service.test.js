import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../config/db.js", () => ({
  default: {
    notification: { create: vi.fn() },
    pushToken: { findMany: vi.fn(), deleteMany: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

import prisma from "../../../config/db.js";
import {
  createNotification,
  formatNotificationForClient,
  notificationDeepLinkFields,
} from "../../../services/notification.service.js";

describe("notification.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
  });

  describe("notificationDeepLinkFields", () => {
    it("returns order tracking hints when orderId is set", () => {
      expect(notificationDeepLinkFields("order-99")).toEqual({
        orderId: "order-99",
        screen: "order_tracking",
        route: "/pedido/order-99",
        url: "/perfil?tab=orders&orderId=order-99",
      });
    });

    it("returns inbox fallback when orderId is absent", () => {
      expect(notificationDeepLinkFields(null)).toEqual({
        orderId: null,
        url: "/notificaciones",
        route: "/notificaciones",
      });
    });
  });

  describe("formatNotificationForClient", () => {
    it("merges deep link fields onto stored notification", () => {
      const formatted = formatNotificationForClient({
        id: "n1",
        userId: "u1",
        type: "ORDER_DELIVERED",
        title: "Entregado",
        message: "Listo",
        orderId: "ord-1",
        read: false,
        createdAt: new Date("2026-01-01"),
      });

      expect(formatted.orderId).toBe("ord-1");
      expect(formatted.screen).toBe("order_tracking");
      expect(formatted.route).toBe("/pedido/ord-1");
    });
  });

  describe("createNotification", () => {
    it("persists orderId and sends push data with order tracking deep links", async () => {
      prisma.user.findUnique.mockResolvedValue({ locale: "es" });
      prisma.notification.create.mockResolvedValue({
        id: "notif-1",
        userId: "user-1",
        type: "ORDER_IN_TRANSIT",
        orderId: "order-99",
      });
      prisma.pushToken.findMany.mockResolvedValue([{ token: "ExponentPushToken[abc]" }]);

      await createNotification({
        userId: "user-1",
        type: "ORDER_IN_TRANSIT",
        template: "ORDER_IN_TRANSIT",
        templateParams: { shortId: "order-99" },
        orderId: "order-99",
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          type: "ORDER_IN_TRANSIT",
          title: "Pedido en camino",
          message: expect.stringContaining("order-99"),
          orderId: "order-99",
        }),
      });

      expect(global.fetch).toHaveBeenCalled();
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body[0].data.orderId).toBe("order-99");
      expect(body[0].data.route).toBe("/pedido/order-99");
      expect(body[0].data.url).toBe("/perfil?tab=orders&orderId=order-99");
      expect(body[0].data.screen).toBe("order_tracking");
    });

    it("translates push copy to user locale", async () => {
      prisma.user.findUnique.mockResolvedValue({ locale: "pt" });
      prisma.notification.create.mockResolvedValue({ id: "n2" });
      prisma.pushToken.findMany.mockResolvedValue([]);

      await createNotification({
        userId: "user-2",
        type: "ORDER_DELIVERED",
        template: "ORDER_DELIVERED",
        templateParams: { shortId: "abcd1234" },
        orderId: "x",
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "Encomenda entregue",
          message: expect.stringContaining("abcd1234"),
        }),
      });
    });

    it("uses Accept-Language when recipient locale is null (e.g. DELIVERY user)", async () => {
      prisma.user.findUnique.mockResolvedValue({ locale: null });
      prisma.notification.create.mockResolvedValue({ id: "n3" });
      prisma.pushToken.findMany.mockResolvedValue([]);

      await createNotification({
        userId: "courier-1",
        type: "ORDER_DELIVERED",
        template: "ORDER_DELIVERED",
        templateParams: { shortId: "zzzz9999" },
        orderId: "ord-2",
        acceptLanguage: "pt-PT",
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "Encomenda entregue",
          message: expect.stringContaining("zzzz9999"),
        }),
      });
    });
  });
});
