import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../config/db.js", () => ({
  default: {
    user: {
      update: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    deliveryProfile: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    orderDeliveryPhoto: {
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("../../../services/notification.service.js", () => ({
  createNotification: vi.fn(),
}));

vi.mock("../../../services/deliveryProximity.service.js", () => ({
  checkAndNotifyCourierNearby: vi.fn(),
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
      prisma.order.count.mockResolvedValue(0);
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

    it("rejects pickup when delivery already has 2 active orders", async () => {
      const req = { user: { id: "delivery-1" }, params: { id: "order-1" } };
      const res = mockRes();

      prisma.order.findUnique.mockResolvedValue({
        id: "order-1",
        status: "CONFIRMED",
        deliveryId: null,
        userId: "user-1",
      });
      prisma.order.count.mockResolvedValue(2);

      await expect(deliveryController.pickupOrder(req, res)).rejects.toThrow(
        /2 pedidos activos/,
      );
      expect(prisma.order.update).not.toHaveBeenCalled();
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

  describe("addDeliveryPhotos", () => {
    it("creates photos for assigned delivery during IN_TRANSIT", async () => {
      const tinyJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
      const photoUrl = `data:image/jpeg;base64,${tinyJpeg.toString("base64")}`;
      const req = {
        user: { id: "delivery-1" },
        params: { id: "order-1" },
        body: { photo: photoUrl },
      };
      const res = mockRes();

      prisma.order.findUnique.mockResolvedValue({
        id: "order-1",
        deliveryId: "delivery-1",
        status: "IN_TRANSIT",
      });
      prisma.orderDeliveryPhoto.count.mockResolvedValue(0);
      prisma.orderDeliveryPhoto.create.mockResolvedValue({
        id: "photo-1",
        url: photoUrl,
      });

      await deliveryController.addDeliveryPhotos(req, res);

      expect(prisma.orderDeliveryPhoto.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("rejects upload from non-assigned delivery", async () => {
      const req = {
        user: { id: "delivery-2" },
        params: { id: "order-1" },
        body: { photo: "data:image/jpeg;base64,abc" },
      };
      const res = mockRes();

      prisma.order.findUnique.mockResolvedValue({
        id: "order-1",
        deliveryId: "delivery-1",
        status: "IN_TRANSIT",
      });

      await expect(deliveryController.addDeliveryPhotos(req, res)).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe("updateProfile locale", () => {
    it("persists locale on User and returns it nested under profile.user", async () => {
      const req = {
        user: { id: "delivery-1" },
        body: { locale: "pt" },
        headers: { "accept-language": "es" },
      };
      const res = mockRes();

      prisma.user.update.mockResolvedValue({});
      prisma.deliveryProfile.findUnique.mockResolvedValue({
        id: "profile-1",
        userId: "delivery-1",
        phone: "+245",
        user: { id: "delivery-1", name: "João", email: "j@x.com", locale: "pt" },
      });

      await deliveryController.updateProfile(req, res);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "delivery-1" },
        data: { locale: "pt" },
      });
      expect(prisma.deliveryProfile.update).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        profile: expect.objectContaining({
          user: expect.objectContaining({ locale: "pt" }),
        }),
      });
    });

    it("rejects unsupported locale", async () => {
      const req = {
        user: { id: "delivery-1" },
        body: { locale: "en" },
        headers: {},
      };
      const res = mockRes();

      await expect(deliveryController.updateProfile(req, res)).rejects.toMatchObject({
        code: "LOCALE_INVALID",
        statusCode: 400,
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe("updateLocation", () => {
    it("rejects non-numeric coordinates with 400", async () => {
      const req = { user: { id: "delivery-1" }, body: { lat: "x", lng: -15.59 } };
      const res = mockRes();

      await expect(deliveryController.updateLocation(req, res)).rejects.toMatchObject({
        statusCode: 400,
        message: "Se requieren lat y lng numéricos",
      });
      expect(prisma.deliveryProfile.update).not.toHaveBeenCalled();
    });

    it("rejects out-of-range coordinates with 400", async () => {
      const req = { user: { id: "delivery-1" }, body: { lat: 11.86, lng: -200 } };
      const res = mockRes();

      await expect(deliveryController.updateLocation(req, res)).rejects.toMatchObject({
        statusCode: 400,
        message: "Coordenadas fuera de rango",
      });
      expect(prisma.deliveryProfile.update).not.toHaveBeenCalled();
    });

    it("updates Prisma currentLocation with ISO updatedAt", async () => {
      const req = { user: { id: "delivery-1" }, body: { lat: 11.86, lng: -15.59 } };
      const res = mockRes();

      prisma.deliveryProfile.findUnique.mockResolvedValue({ id: "profile-1", userId: "delivery-1" });
      prisma.deliveryProfile.update.mockResolvedValue({});

      await deliveryController.updateLocation(req, res);

      expect(prisma.deliveryProfile.update).toHaveBeenCalledWith({
        where: { userId: "delivery-1" },
        data: {
          currentLocation: {
            lat: 11.86,
            lng: -15.59,
            updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
          },
        },
      });
      expect(res.json).toHaveBeenCalledWith({
        message: "Ubicación actualizada",
        location: expect.objectContaining({ lat: 11.86, lng: -15.59 }),
        applied: 1,
        skippedOlder: 0,
      });
    });

    it("flushes a batch and keeps the newest point", async () => {
      const req = {
        user: { id: "delivery-1" },
        body: {
          points: [
            { lat: 11.86, lng: -15.59, updatedAt: "2026-01-01T00:00:00.000Z" },
            { lat: 11.87, lng: -15.58, updatedAt: "2026-01-01T00:01:00.000Z" },
          ],
        },
      };
      const res = mockRes();

      prisma.deliveryProfile.findUnique.mockResolvedValue({ id: "profile-1", userId: "delivery-1" });
      prisma.deliveryProfile.update.mockResolvedValue({});

      await deliveryController.updateLocation(req, res);

      expect(prisma.deliveryProfile.update).toHaveBeenCalledWith({
        where: { userId: "delivery-1" },
        data: {
          currentLocation: expect.objectContaining({ lat: 11.87, lng: -15.58 }),
        },
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ applied: 2, skippedOlder: 0 }),
      );
    });

    it("returns 404 when the delivery profile does not exist", async () => {
      const req = { user: { id: "delivery-1" }, body: { lat: 11.86, lng: -15.59 } };
      const res = mockRes();

      prisma.deliveryProfile.findUnique.mockResolvedValue(null);

      await expect(deliveryController.updateLocation(req, res)).rejects.toMatchObject({
        statusCode: 404,
        message: "Perfil de repartidor no encontrado",
      });
      expect(prisma.deliveryProfile.update).not.toHaveBeenCalled();
    });
  });
});
