import { describe, it, expect } from "vitest";
import { assertValidAvatarValue } from "../../../utils/avatar.js";

const tinyPng = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

describe("avatar validation", () => {
  it("accepts null to delete avatar", () => {
    expect(assertValidAvatarValue(null)).toBe(null);
  });

  it("accepts valid PNG data URL", () => {
    const url = `data:image/png;base64,${tinyPng.toString("base64")}`;
    expect(assertValidAvatarValue(url)).toBe(url);
  });

  it("rejects HTTP URLs", () => {
    expect(() => assertValidAvatarValue("https://cdn.example/a.png")).toThrow(
      /base64/i,
    );
  });

  it("rejects MIME mismatch", () => {
    const url = `data:image/jpeg;base64,${tinyPng.toString("base64")}`;
    expect(() => assertValidAvatarValue(url)).toThrow(/MIME/i);
  });
});
