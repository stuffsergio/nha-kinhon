import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../config/db.js", () => ({
  default: {
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    deliveryProfile: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../../../services/notification.service.js", () => ({
  createNotification: vi.fn(),
}));

import prisma from "../../../config/db.js";
import { createNotification } from "../../../services/notification.service.js";
import * as deliveryController from "../../../controllers/delivery.controller.js";

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe("delivery controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listAvailable", () => {
    it("returns formatted available orders in data array", async () => {
      const req = { user: { id: "delivery-1" }, query: {} };
      const res = mockRes();

      prisma.order.findMany.mockResolvedValue([
        {
          id: "order-1",
          status: "CONFIRMED",
          total: 2500,
          recipientName: "Maria",
          recipientPhone: "+245 123",
          recipientAddress: "Bissau Centro",
          createdAt: new Date("2026-07-15T10:00:00.000Z"),
          items: [{ id: "item-1", productId: "p1", name: "Arroz", price: 2500, quantity: 1 }],
        },
      ]);

      await deliveryController.listAvailable(req, res);

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED"] },
          deliveryId: null,
        },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
      expect(res.json).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            id: "order-1",
            status: "CONFIRMED",
            contactName: "Maria",
            deliveryAddress: "Bissau Centro",
            items: [expect.objectContaining({ name: "Arroz" })],
          }),
        ],
      });
    });
  });

  describe("pickupOrder", () => {
    it("self-assigns delivery user and moves order to PICKED_UP", async () => {
      const req = { user: { id: "delivery-1" }, params: { id: "order-1" } };
      const res = mockRes();

      prisma.order.findUnique.mockResolvedValue({
        id: "order-1",
        status: "SHIPPED",
        deliveryId: null,
        userId: "user-1",
        recipientName: "Maria",
        recipientPhone: "+245 123",
        recipientAddress: "Bissau Centro",
        total: 2500,
        createdAt: new Date("2026-07-15T10:00:00.000Z"),
      });
      prisma.order.update.mockResolvedValue({
        id: "order-1",
        status: "PICKED_UP",
        deliveryId: "delivery-1",
        recipientName: "Maria",
        recipientPhone: "+245 123",
        recipientAddress: "Bissau Centro",
        total: 2500,
        createdAt: new Date("2026-07-15T10:00:00.000Z"),
        items: [],
      });
      prisma.deliveryProfile.update.mockResolvedValue({});

      await deliveryController.pickupOrder(req, res);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: {
          deliveryId: "delivery-1",
          status: "PICKED_UP",
          pickedUpAt: expect.any(Date),
        },
        include: { items: true },
      });
      expect(createNotification).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        order: expect.objectContaining({
          id: "order-1",
          status: "PICKED_UP",
          contactName: "Maria",
        }),
      });
    });

    it("rejects pickup for pending orders", async () => {
      const req = { user: { id: "delivery-1" }, params: { id: "order-1" } };
      const res = mockRes();

      prisma.order.findUnique.mockResolvedValue({
        id: "order-1",
        status: "PENDING",
        deliveryId: null,
        userId: "user-1",
      });

      await expect(deliveryController.pickupOrder(req, res)).rejects.toThrow(
        "El pedido no está disponible para recoger"
      );
    });
  });
});
