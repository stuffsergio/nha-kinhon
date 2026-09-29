import { describe, it, expect } from "vitest";
import { parseRecipientCoordinatesFromBody } from "../../../utils/recipientCoordinates.js";

describe("parseRecipientCoordinatesFromBody", () => {
  it("returns empty when coordinates omitted", () => {
    expect(parseRecipientCoordinatesFromBody({})).toEqual({
      recipientLat: undefined,
      recipientLng: undefined,
    });
  });

  it("parses valid pair", () => {
    expect(
      parseRecipientCoordinatesFromBody({ recipientLat: 11.86, recipientLng: -15.59 }),
    ).toEqual({ recipientLat: 11.86, recipientLng: -15.59 });
  });

  it("rejects partial pair", () => {
    expect(() => parseRecipientCoordinatesFromBody({ recipientLat: 11.86 })).toThrow(
      "recipientLat y recipientLng deben enviarse juntos",
    );
  });

  it("rejects out-of-range values", () => {
    expect(() =>
      parseRecipientCoordinatesFromBody({ recipientLat: 200, recipientLng: 0 }),
    ).toThrow("Coordenadas del destinatario fuera de rango");
  });
});
