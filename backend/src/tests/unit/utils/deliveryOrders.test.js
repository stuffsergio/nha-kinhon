import { describe, it, expect } from "vitest";
import {
  AVAILABLE_ORDER_STATUSES,
  buildAvailableOrdersWhere,
  formatDeliveryOrder,
  isPickupEligible,
  toMobileStatus,
} from "../../../utils/deliveryOrders.js";

describe("deliveryOrders utils", () => {
  describe("toMobileStatus", () => {
    it("maps PROCESSING to PREPARING and SHIPPED to READY", () => {
      expect(toMobileStatus("PROCESSING")).toBe("PREPARING");
      expect(toMobileStatus("SHIPPED")).toBe("READY");
      expect(toMobileStatus("CONFIRMED")).toBe("CONFIRMED");
    });
  });

  describe("isPickupEligible", () => {
    it("allows paid prep statuses and rejects pending or delivered", () => {
      for (const status of AVAILABLE_ORDER_STATUSES) {
        expect(isPickupEligible(status)).toBe(true);
      }
      expect(isPickupEligible("PENDING")).toBe(false);
      expect(isPickupEligible("DELIVERED")).toBe(false);
      expect(isPickupEligible("PICKED_UP")).toBe(false);
    });
  });

  describe("formatDeliveryOrder", () => {
    it("includes mobile aliases and optional items", () => {
      const order = {
        id: "order-1",
        status: "PROCESSING",
        total: 1200,
        recipientName: "Ana",
        recipientPhone: "+245 111",
        recipientAddress: "Bissau Centro",
        createdAt: "2026-07-15T10:00:00.000Z",
        items: [{ id: "item-1", productId: "p1", name: "Arroz", price: 600, quantity: 2 }],
      };

      expect(formatDeliveryOrder(order)).toEqual({
        id: "order-1",
        status: "PREPARING",
        total: 1200,
        recipientName: "Ana",
        recipientPhone: "+245 111",
        recipientAddress: "Bissau Centro",
        contactName: "Ana",
        contactPhone: "+245 111",
        deliveryAddress: "Bissau Centro",
        createdAt: "2026-07-15T10:00:00.000Z",
        items: [{ id: "item-1", productId: "p1", name: "Arroz", price: 600, quantity: 2 }],
      });
    });

    it("omits items when includeItems is false", () => {
      const order = {
        id: "order-1",
        status: "CONFIRMED",
        total: 500,
        recipientName: "Luis",
        recipientPhone: null,
        recipientAddress: null,
        createdAt: "2026-07-15T10:00:00.000Z",
        items: [{ id: "item-1", productId: "p1", name: "Aceite", price: 500, quantity: 1 }],
      };

      const formatted = formatDeliveryOrder(order, { includeItems: false });
      expect(formatted.items).toBeUndefined();
      expect(formatted.contactName).toBe("Luis");
    });
  });

  describe("buildAvailableOrdersWhere", () => {
    it("filters paid-ready orders without delivery assignment", () => {
      expect(buildAvailableOrdersWhere()).toEqual({
        status: { in: AVAILABLE_ORDER_STATUSES },
        deliveryId: null,
      });
    });

    it("adds service area filter when provided", () => {
      expect(buildAvailableOrdersWhere({ serviceAreaFilter: "Bissau" })).toEqual({
        status: { in: AVAILABLE_ORDER_STATUSES },
        deliveryId: null,
        recipientAddress: { contains: "Bissau", mode: "insensitive" },
      });
    });
  });
});
