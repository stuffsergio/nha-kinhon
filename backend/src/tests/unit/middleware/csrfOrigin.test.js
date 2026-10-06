import { describe, it, expect, vi } from "vitest";
import { requireSameSiteOrigin } from "../../../middleware/csrfOrigin.js";
import { AppError } from "../../../utils/errors.js";

vi.mock("../../../config/runtime.js", () => ({
  isOriginAllowed: (origin) => origin === "https://nha-kinhon.vercel.app",
}));

describe("requireSameSiteOrigin", () => {
  it("allows allowed Origin header", () => {
    const next = vi.fn();
    requireSameSiteOrigin(
      { headers: { origin: "https://nha-kinhon.vercel.app" } },
      {},
      next,
    );
    expect(next).toHaveBeenCalled();
  });

  it("blocks disallowed Origin", () => {
    expect(() =>
      requireSameSiteOrigin({ headers: { origin: "https://evil.example" } }, {}, vi.fn()),
    ).toThrow(AppError);
  });

  it("allows missing Origin (native clients)", () => {
    const next = vi.fn();
    requireSameSiteOrigin({ headers: {} }, {}, next);
    expect(next).toHaveBeenCalled();
  });
});
