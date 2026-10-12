import { describe, it, expect } from "vitest";
import {
  refundableRemainingFcfa,
  assertRefundEligibility,
  isPreDispatchForCancel,
  computeOrderRefundStatus,
} from "../../../utils/orderRefunds.js";

describe("orderRefunds", () => {
  const baseOrder = {
    id: "o1",
    total: 10000,
    status: "CONFIRMED",
    deliveryId: null,
    pickedUpAt: null,
    deliveredAt: null,
  };

  it("computes remaining refundable amount", () => {
    const refunds = [{ status: "SUCCEEDED", amount: 3000 }];
    expect(refundableRemainingFcfa(baseOrder, refunds)).toBe(7000);
  });

  it("allows pre-dispatch cancel eligibility", () => {
    expect(isPreDispatchForCancel(baseOrder)).toBe(true);
    expect(isPreDispatchForCancel({ ...baseOrder, deliveryId: "d1" })).toBe(false);
  });

  it("rejects refund when nothing left", () => {
    const refunds = [{ status: "SUCCEEDED", amount: 10000 }];
    const r = assertRefundEligibility(baseOrder, refunds, { reason: "OTHER" });
    expect(r.ok).toBe(false);
  });

  it("maps order refund status", () => {
    expect(computeOrderRefundStatus(10000, 10000)).toBe("REFUNDED");
    expect(computeOrderRefundStatus(10000, 5000)).toBe("PARTIALLY_REFUNDED");
    expect(computeOrderRefundStatus(10000, 0)).toBe(null);
  });
});
