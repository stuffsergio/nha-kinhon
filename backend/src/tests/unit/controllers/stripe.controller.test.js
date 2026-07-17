import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockPaymentIntentsCreate,
  mockEphemeralKeysCreate,
  mockCustomersCreate,
  mockConstructEvent,
} = vi.hoisted(() => ({
  mockPaymentIntentsCreate: vi.fn(),
  mockEphemeralKeysCreate: vi.fn(),
  mockCustomersCreate: vi.fn(),
  mockConstructEvent: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: class Stripe {
    constructor() {
      this.customers = { create: mockCustomersCreate };
      this.paymentIntents = { create: mockPaymentIntentsCreate };
      this.ephemeralKeys = { create: mockEphemeralKeysCreate };
      this.webhooks = { constructEvent: mockConstructEvent };
    }
  },
}));

vi.mock("../../../config/env.js", () => ({
  default: {
    STRIPE_SECRET_KEY: "sk_test_x",
    STRIPE_PUBLISHABLE_KEY: "pk_test_x",
    STRIPE_WEBHOOK_SECRET: "",
    CLIENT_URL: "http://localhost:5173",
  },
}));

vi.mock("../../../config/db.js", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    cartItem: {
      deleteMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}));

import prisma from "../../../config/db.js";
import * as stripeController from "../../../controllers/stripe.controller.js";
import { AppError } from "../../../utils/errors.js";

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe("stripe controller payment sheet + webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPaymentSheet", () => {
    it("requires orderId and links PaymentIntent to unpaid order", async () => {
      const req = {
        user: { id: "user-1" },
        body: { orderId: "order-1" },
      };
      const res = mockRes();

      prisma.order.findUnique.mockResolvedValue({
        id: "order-1",
        userId: "user-1",
        status: "PENDING_PAYMENT",
        total: 2500,
      });
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        stripeCustomerId: "cus_1",
      });
      mockPaymentIntentsCreate.mockResolvedValue({
        id: "pi_123",
        client_secret: "pi_123_secret",
      });
      mockEphemeralKeysCreate.mockResolvedValue({ secret: "ek_secret" });
      prisma.order.update.mockResolvedValue({});

      await stripeController.createPaymentSheet(req, res);

      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2500,
          metadata: { orderId: "order-1", userId: "user-1" },
        }),
      );
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { stripePaymentId: "pi_123" },
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentIntent: "pi_123_secret",
          orderId: "order-1",
        }),
      );
    });

    it("rejects missing orderId", async () => {
      const req = { user: { id: "user-1" }, body: {} };
      const res = mockRes();

      await expect(stripeController.createPaymentSheet(req, res)).rejects.toBeInstanceOf(AppError);
    });
  });

  describe("handleWebhook", () => {
    it("confirms order on payment_intent.succeeded", async () => {
      const req = {
        body: {
          type: "payment_intent.succeeded",
          data: {
            object: {
              id: "pi_123",
              metadata: { orderId: "order-1", userId: "user-1" },
            },
          },
        },
        headers: {},
      };
      const res = mockRes();

      prisma.order.findUnique.mockResolvedValue({
        id: "order-1",
        userId: "user-1",
        status: "PENDING_PAYMENT",
      });
      prisma.order.update.mockResolvedValue({ id: "order-1", status: "CONFIRMED" });

      await stripeController.handleWebhook(req, res);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { status: "CONFIRMED", stripePaymentId: "pi_123" },
      });
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it("cancels unpaid order on payment_intent.canceled", async () => {
      const req = {
        body: {
          type: "payment_intent.canceled",
          data: {
            object: {
              id: "pi_123",
              metadata: { orderId: "order-1" },
            },
          },
        },
        headers: {},
      };
      const res = mockRes();

      prisma.order.findUnique.mockResolvedValue({
        id: "order-1",
        userId: "user-1",
        status: "PENDING_PAYMENT",
      });
      prisma.order.update.mockResolvedValue({ id: "order-1", status: "CANCELLED" });

      await stripeController.handleWebhook(req, res);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { status: "CANCELLED" },
      });
    });
  });
});
