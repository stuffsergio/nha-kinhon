import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../config/db.js", () => ({
  default: {
    cartItem: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}));

vi.mock("../../../services/notification.service.js", () => ({
  createNotification: vi.fn(),
}));

import prisma from "../../../config/db.js";
import { createNotification } from "../../../services/notification.service.js";
import * as ordersController from "../../../controllers/orders.controller.js";
import { AppError } from "../../../utils/errors.js";

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe("orders controller payment flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkout", () => {
    it("creates PENDING_PAYMENT draft and does not clear cart", async () => {
      const req = {
        user: { id: "user-1" },
        body: {
          recipientName: "Ana",
          recipientPhone: "+245",
          recipientAddress: "Bissau",
          notes: "",
        },
      };
      const res = mockRes();

      prisma.cartItem.findMany.mockResolvedValue([
        {
          quantity: 2,
          product: { id: "p1", name: "Arroz", price: 500 },
        },
      ]);
      prisma.order.create.mockResolvedValue({
        id: "order-1",
        status: "PENDING_PAYMENT",
        total: 1000,
        items: [],
      });

      await ordersController.checkout(req, res);

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            status: "PENDING_PAYMENT",
            total: 1000,
          }),
        }),
      );
      expect(prisma.cartItem.deleteMany).not.toHaveBeenCalled();
      expect(prisma.notification.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("confirmAfterPayment", () => {
    it("confirms PENDING_PAYMENT, clears cart and notifies", async () => {
      const req = { user: { id: "user-1" }, params: { id: "order-1" } };
      const res = mockRes();

      prisma.order.findUnique.mockResolvedValue({
        id: "order-1",
        userId: "user-1",
        status: "PENDING_PAYMENT",
      });
      prisma.order.update.mockResolvedValue({
        id: "order-1",
        status: "CONFIRMED",
        items: [],
      });

      await ordersController.confirmAfterPayment(req, res);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { status: "CONFIRMED" },
        include: { items: true },
      });
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });
      expect(createNotification).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it("rejects already confirmed orders", async () => {
      const req = { user: { id: "user-1" }, params: { id: "order-1" } };
      const res = mockRes();

      prisma.order.findUnique.mockResolvedValue({
        id: "order-1",
        userId: "user-1",
        status: "CONFIRMED",
      });

      await expect(ordersController.confirmAfterPayment(req, res)).rejects.toBeInstanceOf(AppError);
    });
  });

  describe("cancel", () => {
    it("cancels unpaid draft owned by user", async () => {
      const req = { user: { id: "user-1" }, params: { id: "order-1" } };
      const res = mockRes();

      prisma.order.findUnique.mockResolvedValue({
        id: "order-1",
        userId: "user-1",
        status: "PENDING_PAYMENT",
      });
      prisma.order.update.mockResolvedValue({
        id: "order-1",
        status: "CANCELLED",
      });

      await ordersController.cancel(req, res);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { status: "CANCELLED" },
      });
      expect(createNotification).toHaveBeenCalled();
    });

    it("rejects cancel of confirmed order", async () => {
      const req = { user: { id: "user-1" }, params: { id: "order-1" } };
      const res = mockRes();

      prisma.order.findUnique.mockResolvedValue({
        id: "order-1",
        userId: "user-1",
        status: "CONFIRMED",
      });

      await expect(ordersController.cancel(req, res)).rejects.toBeInstanceOf(AppError);
    });
  });

  describe("listMyOrders", () => {
    it("excludes unpaid and cancelled by default", async () => {
      const req = { user: { id: "user-1" }, query: {} };
      const res = mockRes();

      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await ordersController.listMyOrders(req, res);

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: "user-1",
            status: { notIn: ["PENDING_PAYMENT", "PENDING", "CANCELLED"] },
          },
        }),
      );
    });
  });
});
