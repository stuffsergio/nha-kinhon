import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../config/db.js", () => ({
  default: {
    order: {
      findUnique: vi.fn(),
    },
  },
}));

import prisma from "../../../config/db.js";
import {
  parseDeliveryLocation,
  parseDestinationCoordinates,
  isCourierLocationFresh,
  courierLocationAgeSeconds,
  deriveCourierSignalState,
  LIVE_LOCATION_MAX_AGE_MS,
  getOrderTrackingPayload,
  toPublicTracking,
  toLeanTracking,
  simplifyRoutePolyline,
} from "../../../utils/orderTracking.js";

function mockOsrmFetch() {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      code: "Ok",
      routes: [
        {
          distance: 900,
          duration: 120,
          geometry: {
            coordinates: [
              [-15.59, 11.86],
              [-15.597, 11.865],
            ],
          },
        },
      ],
    }),
  });
}

describe("parseDeliveryLocation", () => {
  it("parses a valid location with ISO updatedAt", () => {
    expect(
      parseDeliveryLocation({
        lat: 14.7,
        lng: -17.4,
        updatedAt: "2026-08-26T10:00:00.000Z",
      }),
    ).toEqual({
      lat: 14.7,
      lng: -17.4,
      updatedAt: "2026-08-26T10:00:00.000Z",
    });
  });

  it("includes heading, accuracy and speed when valid", () => {
    expect(
      parseDeliveryLocation({
        lat: 11.86,
        lng: -15.59,
        updatedAt: "2026-08-26T10:00:00.000Z",
        heading: 90,
        accuracy: 12.5,
        speed: 8,
      }),
    ).toEqual({
      lat: 11.86,
      lng: -15.59,
      updatedAt: "2026-08-26T10:00:00.000Z",
      heading: 90,
      accuracy: 12.5,
      speed: 8,
    });
  });

  it("omits invalid optional motion fields", () => {
    expect(
      parseDeliveryLocation({
        lat: 11.86,
        lng: -15.59,
        heading: 400,
        accuracy: -1,
      }),
    ).toEqual({
      lat: 11.86,
      lng: -15.59,
      updatedAt: null,
    });
  });

  it("coerces numeric strings", () => {
    expect(parseDeliveryLocation({ lat: "11.86", lng: "-15.59" })).toEqual({
      lat: 11.86,
      lng: -15.59,
      updatedAt: null,
    });
  });

  it("accepts boundary coordinates", () => {
    expect(parseDeliveryLocation({ lat: 90, lng: 180 })).toMatchObject({ lat: 90, lng: 180 });
    expect(parseDeliveryLocation({ lat: -90, lng: -180 })).toMatchObject({ lat: -90, lng: -180 });
  });

  it("returns null for missing or non-object values", () => {
    expect(parseDeliveryLocation(null)).toBeNull();
    expect(parseDeliveryLocation(undefined)).toBeNull();
    expect(parseDeliveryLocation("11.86,-15.59")).toBeNull();
    expect(parseDeliveryLocation([{ lat: 1, lng: 1 }])).toBeNull();
    expect(parseDeliveryLocation({})).toBeNull();
  });

  it("returns null for out-of-range coordinates", () => {
    expect(parseDeliveryLocation({ lat: 200, lng: 0 })).toBeNull();
    expect(parseDeliveryLocation({ lat: -91, lng: 0 })).toBeNull();
    expect(parseDeliveryLocation({ lat: 0, lng: 181 })).toBeNull();
    expect(parseDeliveryLocation({ lat: 0, lng: -181 })).toBeNull();
  });

  it("returns null for non-finite coordinates", () => {
    expect(parseDeliveryLocation({ lat: "x", lng: 1 })).toBeNull();
    expect(parseDeliveryLocation({ lat: NaN, lng: 0 })).toBeNull();
    expect(parseDeliveryLocation({ lat: Infinity, lng: 0 })).toBeNull();
    expect(parseDeliveryLocation({ lat: 0 })).toBeNull();
  });

  it("sets updatedAt to null when it is not an ISO string", () => {
    expect(parseDeliveryLocation({ lat: 1, lng: 1, updatedAt: 123 }).updatedAt).toBeNull();
    expect(parseDeliveryLocation({ lat: 1, lng: 1, updatedAt: "ayer" }).updatedAt).toBeNull();
    expect(parseDeliveryLocation({ lat: 1, lng: 1 }).updatedAt).toBeNull();
  });
});

describe("parseDestinationCoordinates", () => {
  it("parses stored order coordinates", () => {
    expect(parseDestinationCoordinates(11.863, -15.598)).toEqual({
      lat: 11.863,
      lng: -15.598,
    });
  });

  it("returns null pair when missing", () => {
    expect(parseDestinationCoordinates(null, null)).toEqual({ lat: null, lng: null });
  });
});

describe("courierLocationAgeSeconds", () => {
  it("returns whole seconds since updatedAt", () => {
    const now = Date.parse("2026-09-29T12:00:00.000Z");
    expect(
      courierLocationAgeSeconds({ updatedAt: "2026-09-29T11:59:30.000Z" }, now),
    ).toBe(30);
  });
});

describe("deriveCourierSignalState", () => {
  it("returns null outside live-tracking statuses", () => {
    expect(deriveCourierSignalState(false, { lat: 1, lng: 1 }, true)).toBeNull();
  });

  it("classifies LIVE, STALE and NO_GPS", () => {
    expect(deriveCourierSignalState(true, { lat: 1, lng: 1 }, true)).toBe("LIVE");
    expect(deriveCourierSignalState(true, { lat: 1, lng: 1 }, false)).toBe("STALE");
    expect(deriveCourierSignalState(true, null, false)).toBe("NO_GPS");
  });
});

describe("isCourierLocationFresh", () => {
  it("is fresh within the max age window", () => {
    const now = Date.parse("2026-09-29T12:00:00.000Z");
    const location = { updatedAt: "2026-09-29T11:59:00.000Z" };
    expect(isCourierLocationFresh(location, now)).toBe(true);
  });

  it("is stale when older than max age", () => {
    const now = Date.parse("2026-09-29T12:00:00.000Z");
    const location = {
      updatedAt: new Date(now - LIVE_LOCATION_MAX_AGE_MS - 1).toISOString(),
    };
    expect(isCourierLocationFresh(location, now)).toBe(false);
  });
});

describe("toPublicTracking", () => {
  it("omits userId from the payload", () => {
    const publicTracking = toPublicTracking({
      orderId: "order-1",
      userId: "user-1",
      status: "IN_TRANSIT",
    });
    expect(publicTracking).toEqual({ orderId: "order-1", status: "IN_TRANSIT" });
    expect(publicTracking).not.toHaveProperty("userId");
  });
});

describe("getOrderTrackingPayload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const nowMs = Date.parse("2026-09-29T12:00:00.000Z");
  const freshUpdatedAt = new Date(nowMs - 30_000).toISOString();

  const baseOrder = {
    id: "order-1",
    userId: "user-1",
    status: "IN_TRANSIT",
    deliveryId: "delivery-1",
    recipientName: "Ana",
    recipientAddress: "Bissau Centro",
    recipientLat: 11.865,
    recipientLng: -15.597,
    delivery: {
      id: "delivery-1",
      name: "Joao",
      deliveryProfile: {
        phone: "+245 111",
        currentLocation: {
          lat: 11.86,
          lng: -15.59,
          updatedAt: freshUpdatedAt,
        },
      },
    },
  };

  it("returns null when the order does not exist", async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    expect(await getOrderTrackingPayload("missing")).toBeNull();
  });

  it("marks isLive when status is in transit and GPS is fresh", async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    const payload = await getOrderTrackingPayload("order-1", {
      nowMs,
      routeOptions: { fetchFn: mockOsrmFetch() },
    });
    expect(payload).toMatchObject({
      orderId: "order-1",
      userId: "user-1",
      deliveryName: "Joao",
      deliveryPhone: "+245 111",
      destination: {
        name: "Ana",
        address: "Bissau Centro",
        lat: 11.865,
        lng: -15.597,
      },
      courierLocation: { lat: 11.86, lng: -15.59, updatedAt: freshUpdatedAt },
      courierSignalState: "LIVE",
      lastLocationAt: freshUpdatedAt,
      lastLocationAgeSeconds: 30,
      isLive: true,
      courierLocationStale: false,
      etaSeconds: expect.any(Number),
      etaLabel: expect.any(String),
      routePolyline: expect.any(Array),
    });
  });

  it("is not live when GPS timestamp is stale", async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      delivery: {
        ...baseOrder.delivery,
        deliveryProfile: {
          phone: "+245 111",
          currentLocation: {
            lat: 11.86,
            lng: -15.59,
            updatedAt: "2026-08-26T10:00:00.000Z",
          },
        },
      },
    });
    const payload = await getOrderTrackingPayload("order-1", {
      nowMs,
      routeOptions: { fetchFn: mockOsrmFetch() },
    });
    expect(payload.isLive).toBe(false);
    expect(payload.courierLocationStale).toBe(true);
    expect(payload.courierSignalState).toBe("STALE");
  });

  it("is not live when GPS is missing even if picked up", async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      status: "PICKED_UP",
      delivery: {
        ...baseOrder.delivery,
        deliveryProfile: { phone: "+245 111", currentLocation: null },
      },
    });
    const payload = await getOrderTrackingPayload("order-1", {
      nowMs,
      routeOptions: { fetchFn: mockOsrmFetch() },
    });
    expect(payload.courierLocation).toBeNull();
    expect(payload.isLive).toBe(false);
    expect(payload.courierLocationStale).toBe(false);
    expect(payload.courierSignalState).toBe("NO_GPS");
  });

  it("does not crash when the courier has no deliveryProfile", async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      delivery: { id: "delivery-1", name: "Joao", deliveryProfile: null },
    });
    const payload = await getOrderTrackingPayload("order-1", {
      nowMs,
      routeOptions: { fetchFn: mockOsrmFetch() },
    });
    expect(payload.courierLocation).toBeNull();
    expect(payload.deliveryPhone).toBeNull();
    expect(payload.isLive).toBe(false);
    expect(payload.courierSignalState).toBe("NO_GPS");
  });

  describe("toLeanTracking", () => {
    it("drops bulky fields and simplifies polyline", () => {
      const polyline = Array.from({ length: 100 }, (_, i) => [11 + i * 0.001, -15]);
      const lean = toLeanTracking(
        toPublicTracking({
          orderId: "o1",
          userId: "u1",
          status: "IN_TRANSIT",
          deliveryId: "d1",
          deliveryName: "Joao",
          deliveryPhone: "+245",
          destination: { name: "Ana", address: "Rua 1", lat: 11.9, lng: -15.6 },
          courierSignalState: "LIVE",
          courierLocation: {
            lat: 11.86,
            lng: -15.59,
            updatedAt: "2026-01-01T00:00:00.000Z",
            accuracy: 10,
            speed: 5,
          },
          lastLocationAgeSeconds: 3,
          etaSeconds: 300,
          etaLabel: "~5 min",
          routePolyline: polyline,
          routeDistanceMeters: 900,
          isLive: true,
          courierLocationStale: false,
        }),
      );

      expect(lean).not.toHaveProperty("deliveryName");
      expect(lean).not.toHaveProperty("isLive");
      expect(lean.destination).toEqual({ lat: 11.9, lng: -15.6 });
      expect(lean.courierLocation).toEqual({
        lat: 11.86,
        lng: -15.59,
        updatedAt: "2026-01-01T00:00:00.000Z",
      });
      expect(lean.routePolyline.length).toBeLessThanOrEqual(32);
      expect(lean.routePolyline[0]).toEqual(polyline[0]);
      expect(lean.routePolyline.at(-1)).toEqual(polyline.at(-1));
    });
  });

  describe("simplifyRoutePolyline", () => {
    it("returns small polylines unchanged", () => {
      const p = [
        [1, 2],
        [3, 4],
      ];
      expect(simplifyRoutePolyline(p)).toBe(p);
    });
  });

  it("is not live for confirmed orders even with GPS", async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      status: "CONFIRMED",
    });
    const payload = await getOrderTrackingPayload("order-1", {
      nowMs,
      routeOptions: { fetchFn: mockOsrmFetch() },
    });
    expect(payload.courierLocation).not.toBeNull();
    expect(payload.isLive).toBe(false);
    expect(payload.courierLocationStale).toBe(false);
    expect(payload.courierSignalState).toBeNull();
  });
});
