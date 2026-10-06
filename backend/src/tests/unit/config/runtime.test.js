import { describe, it, expect, vi, afterEach } from "vitest";

describe("runtime helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allowUnverifiedPaymentConfirm only in dev without Stripe", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALLOW_UNVERIFIED_PAYMENT_CONFIRM", "true");
    vi.doMock("../../../config/env.js", () => ({
      default: { STRIPE_SECRET_KEY: "", CLIENT_URL: "http://localhost:5173" },
    }));
    const { allowUnverifiedPaymentConfirm } = await import("../../../config/runtime.js");
    expect(allowUnverifiedPaymentConfirm()).toBe(true);
  });

  it("isOriginAllowed accepts configured client URL", async () => {
    vi.resetModules();
    vi.doMock("../../../config/env.js", () => ({
      default: { CLIENT_URL: "https://nha-kinhon.vercel.app,http://localhost:5173" },
    }));
    const { isOriginAllowed } = await import("../../../config/runtime.js");
    expect(isOriginAllowed("https://nha-kinhon.vercel.app")).toBe(true);
    expect(isOriginAllowed("https://evil.example")).toBe(false);
  });
});
