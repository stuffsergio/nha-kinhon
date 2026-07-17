import { describe, it, expect } from "vitest";
import {
  UNPAID_ORDER_STATUSES,
  DEFAULT_HIDDEN_ORDER_STATUSES,
  isUnpaidOrderStatus,
  applyDefaultOrderListFilter,
} from "../../../utils/orderPayment.js";

describe("orderPayment utils", () => {
  it("treats PENDING_PAYMENT and PENDING as unpaid", () => {
    expect(isUnpaidOrderStatus("PENDING_PAYMENT")).toBe(true);
    expect(isUnpaidOrderStatus("PENDING")).toBe(true);
    expect(isUnpaidOrderStatus("CONFIRMED")).toBe(false);
    expect(isUnpaidOrderStatus("CANCELLED")).toBe(false);
    expect(UNPAID_ORDER_STATUSES).toEqual(["PENDING_PAYMENT", "PENDING"]);
  });

  it("hides unpaid and cancelled from default lists", () => {
    expect(DEFAULT_HIDDEN_ORDER_STATUSES).toEqual([
      "PENDING_PAYMENT",
      "PENDING",
      "CANCELLED",
    ]);

    const where = applyDefaultOrderListFilter({ userId: "u1" });
    expect(where).toEqual({
      userId: "u1",
      status: { notIn: DEFAULT_HIDDEN_ORDER_STATUSES },
    });
  });

  it("respects explicit status filter", () => {
    const where = applyDefaultOrderListFilter({ userId: "u1" }, "PENDING_PAYMENT");
    expect(where).toEqual({ userId: "u1", status: "PENDING_PAYMENT" });
  });
});
