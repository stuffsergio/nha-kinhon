import { describe, it, expect } from "vitest";
import {
  authLimiter,
  confirmPaymentLimiter,
  deliveryLocationLimiter,
} from "../../../middleware/rateLimits.js";

describe("rate limiters", () => {
  it("exports configured middleware functions", () => {
    expect(typeof confirmPaymentLimiter).toBe("function");
    expect(typeof authLimiter).toBe("function");
    expect(typeof deliveryLocationLimiter).toBe("function");
  });
});
