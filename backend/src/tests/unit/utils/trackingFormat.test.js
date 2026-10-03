import { describe, it, expect } from "vitest";
import { formatTrackingHttpBody, wantsLeanTracking } from "../../../utils/trackingFormat.js";

const sample = {
  orderId: "o1",
  userId: "u1",
  status: "IN_TRANSIT",
  courierSignalState: "LIVE",
  courierLocation: { lat: 1, lng: 2, updatedAt: "2026-01-01T00:00:00.000Z" },
  lastLocationAgeSeconds: 1,
  etaLabel: "~1 min",
  etaSeconds: 60,
  destination: { lat: 3, lng: 4, name: "X", address: "Y" },
  routePolyline: null,
};

describe("wantsLeanTracking", () => {
  it("detects fields=lean query", () => {
    const req = { query: { fields: "lean" }, get: () => "" };
    expect(wantsLeanTracking(req)).toBe(true);
  });

  it("detects lean Accept variant", () => {
    const req = {
      query: {},
      get: (h) => (h === "Accept" ? "application/vnd.nhakinhon.tracking.lean+json" : ""),
    };
    expect(wantsLeanTracking(req)).toBe(true);
  });
});

describe("formatTrackingHttpBody", () => {
  it("returns full tracking by default", () => {
    const body = formatTrackingHttpBody(sample);
    expect(body.tracking.destination.name).toBe("X");
    expect(body).not.toHaveProperty("lean");
  });

  it("returns lean envelope when requested", () => {
    const body = formatTrackingHttpBody(sample, { lean: true });
    expect(body.lean).toBe(true);
    expect(body.tracking.destination).toEqual({ lat: 3, lng: 4 });
    expect(body.tracking).not.toHaveProperty("userId");
  });
});
