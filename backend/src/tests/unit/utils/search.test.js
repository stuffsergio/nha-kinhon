import { describe, it, expect } from "vitest";
import {
  parseProductSort,
  parseLimit,
  parsePage,
  buildProductTextWhere,
} from "../../../utils/search.js";

describe("search utils", () => {
  describe("parseProductSort", () => {
    it("should default to name ascending", () => {
      expect(parseProductSort()).toEqual({ name: "asc" });
      expect(parseProductSort("invalid")).toEqual({ name: "asc" });
    });

    it("should map known sort values", () => {
      expect(parseProductSort("price_asc")).toEqual({ price: "asc" });
      expect(parseProductSort("price_desc")).toEqual({ price: "desc" });
      expect(parseProductSort("name_desc")).toEqual({ name: "desc" });
    });
  });

  describe("parseLimit", () => {
    it("should clamp invalid values to fallback", () => {
      expect(parseLimit(undefined, 8)).toBe(8);
      expect(parseLimit("0", 8)).toBe(8);
      expect(parseLimit("-1", 8)).toBe(8);
    });

    it("should enforce max limit", () => {
      expect(parseLimit("100", 8, 50)).toBe(50);
    });
  });

  describe("parsePage", () => {
    it("should default invalid pages to 1", () => {
      expect(parsePage()).toBe(1);
      expect(parsePage("0")).toBe(1);
    });

    it("should parse valid page numbers", () => {
      expect(parsePage("3")).toBe(3);
    });
  });

  describe("buildProductTextWhere", () => {
    it("should search available products by name and description", () => {
      expect(buildProductTextWhere("arroz")).toEqual({
        available: true,
        OR: [
          { name: { contains: "arroz", mode: "insensitive" } },
          { description: { contains: "arroz", mode: "insensitive" } },
        ],
      });
    });
  });
});
