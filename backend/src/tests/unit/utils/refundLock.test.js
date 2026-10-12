import { describe, it, expect } from "vitest";
import { maxRefundableForRefund } from "../../../utils/refundLock.js";

describe("refundLock maxRefundableForRefund", () => {
  const order = { total: 10000 };

  it("excludes current pending refund from reserved total when approving", () => {
    const refunds = [
      { id: "r1", status: "PENDING", amount: 4000 },
      { id: "r2", status: "SUCCEEDED", amount: 2000 },
    ];
    expect(maxRefundableForRefund(order, refunds, "r1")).toBe(8000);
  });

  it("prevents approving more than order total across refunds", () => {
    const refunds = [
      { id: "r1", status: "PENDING", amount: 6000 },
      { id: "r2", status: "PENDING", amount: 5000 },
    ];
    expect(maxRefundableForRefund(order, refunds, "r1")).toBe(5000);
  });
});
