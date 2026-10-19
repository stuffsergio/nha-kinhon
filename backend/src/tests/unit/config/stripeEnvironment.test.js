import { describe, it, expect, vi, afterEach } from "vitest";

describe("stripe environment guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("allows sk_test when APP_ENV=staging", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc");
    vi.stubEnv("APP_ENV", "staging");
    vi.stubEnv("NODE_ENV", "production");
    const exit = vi.spyOn(process, "exit").mockImplementation(() => {});
    const { assertStripeEnvironmentAlignment } = await import(
      "../../../config/stripeEnvironment.js"
    );
    assertStripeEnvironmentAlignment();
    expect(exit).not.toHaveBeenCalled();
    exit.mockRestore();
  });

  it("exits when production uses sk_test", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc");
    vi.stubEnv("APP_ENV", "production");
    const exit = vi.spyOn(process, "exit").mockImplementation(() => {});
    const { assertStripeEnvironmentAlignment } = await import(
      "../../../config/stripeEnvironment.js"
    );
    assertStripeEnvironmentAlignment();
    expect(exit).toHaveBeenCalledWith(1);
    exit.mockRestore();
  });

  it("exits when staging uses sk_live", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_abc");
    vi.stubEnv("APP_ENV", "staging");
    const exit = vi.spyOn(process, "exit").mockImplementation(() => {});
    const { assertStripeEnvironmentAlignment } = await import(
      "../../../config/stripeEnvironment.js"
    );
    assertStripeEnvironmentAlignment();
    expect(exit).toHaveBeenCalledWith(1);
    exit.mockRestore();
  });
});
