import { describe, it, expect } from "vitest";
import { haversineDistanceMeters, COURIER_NEARBY_THRESHOLD_METERS } from "../../../utils/geo.js";

describe("geo", () => {
  it("returns ~0 for identical coordinates", () => {
    expect(haversineDistanceMeters(11.86, -15.59, 11.86, -15.59)).toBeLessThan(1);
  });

  it("computes a plausible distance between two Bissau points", () => {
    const d = haversineDistanceMeters(11.863, -15.598, 11.870, -15.590);
    expect(d).toBeGreaterThan(500);
    expect(d).toBeLessThan(2000);
  });

  it("uses a 500m nearby threshold constant", () => {
    expect(COURIER_NEARBY_THRESHOLD_METERS).toBe(500);
  });
});
