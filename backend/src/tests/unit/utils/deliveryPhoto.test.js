import { describe, it, expect } from "vitest";
import { assertValidDeliveryPhotoUrl } from "../../../utils/deliveryPhoto.js";

const tinyPng = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

describe("deliveryPhoto validation", () => {
  it("accepts data URL with matching PNG magic bytes", () => {
    const b64 = tinyPng.toString("base64");
    const url = `data:image/png;base64,${b64}`;
    expect(assertValidDeliveryPhotoUrl(url)).toBe(url);
  });

  it("rejects data URL when MIME does not match content", () => {
    const b64 = tinyPng.toString("base64");
    const url = `data:image/jpeg;base64,${b64}`;
    expect(() => assertValidDeliveryPhotoUrl(url)).toThrow(/MIME/i);
  });

  it("rejects non-image data URLs", () => {
    expect(() => assertValidDeliveryPhotoUrl("data:text/plain;base64,YQ==")).toThrow();
  });
});
