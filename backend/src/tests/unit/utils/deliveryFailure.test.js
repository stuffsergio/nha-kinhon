import { describe, it, expect } from "vitest";
import { resolveStatusAfterFailure } from "../../../utils/deliveryFailure.js";

describe("deliveryFailure", () => {
  it("marks refused as undeliverable immediately", () => {
    expect(
      resolveStatusAfterFailure({ reason: "RECIPIENT_REFUSED", failedAttemptsAfter: 1 }),
    ).toBe("UNDELIVERABLE");
  });

  it("allows retry before max attempts", () => {
    expect(
      resolveStatusAfterFailure({ reason: "RECIPIENT_ABSENT", failedAttemptsAfter: 1 }),
    ).toBe("DELIVERY_FAILED_ATTEMPT");
  });

  it("exhausts attempts to undeliverable", () => {
    expect(
      resolveStatusAfterFailure({ reason: "WRONG_ADDRESS", failedAttemptsAfter: 2 }),
    ).toBe("UNDELIVERABLE");
  });
});
