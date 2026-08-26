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
  getOrderTrackingPayload,
  toPublicTracking,
} from "../../../utils/orderTracking.js";

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

  const baseOrder = {
    id: "order-1",
    userId: "user-1",
    status: "IN_TRANSIT",
    deliveryId: "delivery-1",
    recipientName: "Ana",
    recipientAddress: "Bissau Centro",
    delivery: {
      id: "delivery-1",
      name: "Joao",
      deliveryProfile: {
        phone: "+245 111",
        currentLocation: {
          lat: 11.86,
          lng: -15.59,
          updatedAt: "2026-08-26T10:00:00.000Z",
        },
      },
    },
  };

  it("returns null when the order does not exist", async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    expect(await getOrderTrackingPayload("missing")).toBeNull();
  });

  it("marks isLive when status is in transit and GPS exists", async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    const payload = await getOrderTrackingPayload("order-1");
    expect(payload).toMatchObject({
      orderId: "order-1",
      userId: "user-1",
      deliveryName: "Joao",
      deliveryPhone: "+245 111",
      destination: { name: "Ana", address: "Bissau Centro", lat: null, lng: null },
      courierLocation: { lat: 11.86, lng: -15.59, updatedAt: "2026-08-26T10:00:00.000Z" },
      isLive: true,
    });
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
    const payload = await getOrderTrackingPayload("order-1");
    expect(payload.courierLocation).toBeNull();
    expect(payload.isLive).toBe(false);
  });

  it("does not crash when the courier has no deliveryProfile", async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      delivery: { id: "delivery-1", name: "Joao", deliveryProfile: null },
    });
    const payload = await getOrderTrackingPayload("order-1");
    expect(payload.courierLocation).toBeNull();
    expect(payload.deliveryPhone).toBeNull();
    expect(payload.isLive).toBe(false);
  });

  it("is not live for confirmed orders even with GPS", async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      status: "CONFIRMED",
    });
    const payload = await getOrderTrackingPayload("order-1");
    expect(payload.courierLocation).not.toBeNull();
    expect(payload.isLive).toBe(false);
  });
});
