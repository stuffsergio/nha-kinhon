import { describe, it, expect } from "vitest";
import { localeFromRequestBody } from "../../../utils/userLocale.js";

describe("localeFromRequestBody", () => {
  it("returns undefined when locale omitted", () => {
    expect(localeFromRequestBody(undefined)).toBeUndefined();
  });

  it("returns null for empty or null locale", () => {
    expect(localeFromRequestBody(null)).toBeNull();
    expect(localeFromRequestBody("")).toBeNull();
  });

  it("normalizes supported locales", () => {
    expect(localeFromRequestBody("pt-BR")).toBe("pt");
    expect(localeFromRequestBody("pov")).toBe("pov");
  });

  it("throws LOCALE_INVALID for unsupported values", () => {
    expect(() => localeFromRequestBody("en")).toThrow(
      expect.objectContaining({ code: "LOCALE_INVALID", statusCode: 400 }),
    );
  });
});
