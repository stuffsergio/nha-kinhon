import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRetrieve = vi.fn();

vi.mock("../../../config/env.js", () => ({
  default: { STRIPE_SECRET_KEY: "sk_test_x" },
}));

vi.mock("stripe", () => ({
  default: class Stripe {
    constructor() {
      this.paymentIntents = { retrieve: mockRetrieve };
      this.checkout = { sessions: { retrieve: vi.fn() } };
    }
  },
}));

import {
  assertPaymentIntentMatchesOrder,
  assertStripePaymentSucceededForOrder,
} from "../../../services/stripe.service.js";
import { AppError } from "../../../utils/errors.js";

describe("stripe.service payment verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects payment intent with wrong amount", () => {
    expect(() =>
      assertPaymentIntentMatchesOrder(
        { status: "succeeded", amount: 100, metadata: { orderId: "o1", userId: "u1" } },
        { id: "o1", userId: "u1", total: 2500 },
      ),
    ).toThrow(AppError);
  });

  it("accepts succeeded payment intent matching order", () => {
    expect(() =>
      assertPaymentIntentMatchesOrder(
        { status: "succeeded", amount: 2500, metadata: { orderId: "o1", userId: "u1" } },
        { id: "o1", userId: "u1", total: 2500 },
      ),
    ).not.toThrow();
  });

  it("retrieve PI for order.stripePaymentId", async () => {
    mockRetrieve.mockResolvedValue({
      id: "pi_123",
      status: "succeeded",
      amount: 900,
      metadata: { orderId: "order-1", userId: "user-1" },
    });

    const result = await assertStripePaymentSucceededForOrder({
      id: "order-1",
      userId: "user-1",
      total: 900,
      stripePaymentId: "pi_123",
    });

    expect(result.stripePaymentId).toBe("pi_123");
    expect(mockRetrieve).toHaveBeenCalledWith("pi_123");
  });
});
