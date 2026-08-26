import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../config/db.js", () => ({
  default: {
    order: {
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    deliveryProfile: {
      findMany: vi.fn(),
      update: vi.fn(),
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

import { getOrderTrackingPayload } from "../../../utils/orderTracking.js";
import * as adminDeliveryController from "../../../controllers/admin.delivery.controller.js";

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe("admin delivery controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrderTracking", () => {
    it("returns tracking without userId and without status restriction", async () => {
      const req = { user: { id: "admin-1", role: "ADMIN" }, params: { id: "order-1" } };
      const res = mockRes();

      getOrderTrackingPayload.mockResolvedValue({
        orderId: "order-1",
        userId: "user-1",
        status: "PENDING_PAYMENT",
        deliveryId: null,
        deliveryName: null,
        deliveryPhone: null,
        destination: { name: "Ana", address: "Bissau", lat: null, lng: null },
        courierLocation: null,
        isLive: false,
      });

      await adminDeliveryController.getOrderTracking(req, res);

      expect(res.json).toHaveBeenCalledWith({
        tracking: expect.objectContaining({
          orderId: "order-1",
          status: "PENDING_PAYMENT",
          courierLocation: null,
          isLive: false,
        }),
      });
      expect(res.json.mock.calls[0][0].tracking).not.toHaveProperty("userId");
    });

    it("throws 404 when the order does not exist", async () => {
      const req = { user: { id: "admin-1", role: "ADMIN" }, params: { id: "missing" } };
      const res = mockRes();
      getOrderTrackingPayload.mockResolvedValue(null);

      await expect(adminDeliveryController.getOrderTracking(req, res)).rejects.toMatchObject({
        statusCode: 404,
        message: "Pedido no encontrado",
      });
    });
  });
});
