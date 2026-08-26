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

vi.mock("../../../utils/orderTracking.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getOrderTrackingPayload: vi.fn(),
  };
});

import prisma from "../../../config/db.js";
import { createNotification } from "../../../services/notification.service.js";
import { getOrderTrackingPayload } from "../../../utils/orderTracking.js";
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

  describe("getTracking", () => {
    const liveTracking = {
      orderId: "order-1",
      userId: "user-1",
      status: "IN_TRANSIT",
      deliveryId: "delivery-1",
      deliveryName: "Joao",
      deliveryPhone: "+245 111",
      destination: { name: "Ana", address: "Bissau", lat: null, lng: null },
      courierLocation: { lat: 11.86, lng: -15.59, updatedAt: "2026-08-26T10:00:00.000Z" },
      isLive: true,
    };

    it("throws 404 when the order does not exist", async () => {
      const req = { user: { id: "user-1", role: "USER" }, params: { id: "missing" } };
      const res = mockRes();
      getOrderTrackingPayload.mockResolvedValue(null);

      await expect(ordersController.getTracking(req, res)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("returns tracking without userId for the order owner", async () => {
      const req = { user: { id: "user-1", role: "USER" }, params: { id: "order-1" } };
      const res = mockRes();
      getOrderTrackingPayload.mockResolvedValue(liveTracking);

      await ordersController.getTracking(req, res);

      expect(res.json).toHaveBeenCalledWith({
        tracking: expect.objectContaining({
          orderId: "order-1",
          status: "IN_TRANSIT",
          isLive: true,
        }),
      });
      expect(res.json.mock.calls[0][0].tracking).not.toHaveProperty("userId");
    });

    it("forbids another user from viewing tracking", async () => {
      const req = { user: { id: "user-2", role: "USER" }, params: { id: "order-1" } };
      const res = mockRes();
      getOrderTrackingPayload.mockResolvedValue(liveTracking);

      await expect(ordersController.getTracking(req, res)).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it("rejects unpaid orders for the owner", async () => {
      const req = { user: { id: "user-1", role: "USER" }, params: { id: "order-1" } };
      const res = mockRes();
      getOrderTrackingPayload.mockResolvedValue({
        ...liveTracking,
        status: "PENDING_PAYMENT",
        isLive: false,
        courierLocation: null,
      });

      await expect(ordersController.getTracking(req, res)).rejects.toMatchObject({
        statusCode: 400,
        message: "El seguimiento estará disponible tras confirmar el pago",
      });
    });

    it("allows admin to view tracking of any order including unpaid", async () => {
      const req = { user: { id: "admin-1", role: "ADMIN" }, params: { id: "order-1" } };
      const res = mockRes();
      getOrderTrackingPayload.mockResolvedValue({
        ...liveTracking,
        status: "PENDING",
        isLive: false,
      });

      await ordersController.getTracking(req, res);

      expect(res.json).toHaveBeenCalledWith({
        tracking: expect.objectContaining({ orderId: "order-1", status: "PENDING" }),
      });
      expect(res.json.mock.calls[0][0].tracking).not.toHaveProperty("userId");
    });
  });
});
