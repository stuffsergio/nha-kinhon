import { describe, it, expect } from "vitest";

describe("sentry scrubbing", () => {
  it("is disabled without SENTRY_DSN", async () => {
    const { isSentryEnabled } = await import("../../../config/sentry.js");
    const prev = process.env.SENTRY_DSN;
    delete process.env.SENTRY_DSN;
    expect(isSentryEnabled()).toBe(false);
    if (prev) process.env.SENTRY_DSN = prev;
  });
});
