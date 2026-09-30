import { describe, it, expect } from "vitest";
import { buildOrderReceipt } from "../../../utils/orderReceipt.js";

describe("buildOrderReceipt", () => {
  it("builds structured receipt and WhatsApp-friendly share text", () => {
    const order = {
      id: "clorder123456789",
      status: "IN_TRANSIT",
      subtotal: 5000,
      shipping: 0,
      total: 5000,
      recipientName: "Maria",
      recipientPhone: "+245 123",
      recipientAddress: "Bissau",
      createdAt: new Date("2026-09-30T12:00:00.000Z"),
      items: [{ name: "Arroz", price: 2500, quantity: 2 }],
    };

    const { receipt, shareText, trackingPath } = buildOrderReceipt(order);

    expect(receipt.shortId).toBe("clorder1");
    expect(receipt.statusLabel).toBe("En camino");
    expect(receipt.items).toHaveLength(1);
    expect(shareText).toContain("Nha Kinhon");
    expect(shareText).toContain("Maria");
    expect(shareText).toContain("Arroz");
    expect(trackingPath).toContain("clorder123456789");
  });
});
