import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../config/db.js", () => ({
  default: {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    market: {
      findMany: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}));

import prisma from "../../../config/db.js";
import * as searchController from "../../../controllers/search.controller.js";

function mockRes() {
  return { json: vi.fn(), status: vi.fn().mockReturnThis() };
}

describe("search controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("search", () => {
    it("should return empty arrays when query is missing", async () => {
      const req = { query: {} };
      const res = mockRes();

      await searchController.search(req, res);

      expect(prisma.product.findMany).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        products: [],
        markets: [],
        categories: [],
      });
    });

    it("should use legacy limits when pagination is not requested", async () => {
      const req = { query: { q: "arroz" } };
      const res = mockRes();

      prisma.product.findMany.mockResolvedValue([]);
      prisma.market.findMany.mockResolvedValue([]);
      prisma.category.findMany.mockResolvedValue([]);

      await searchController.search(req, res);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          available: true,
          OR: [
            { name: { contains: "arroz", mode: "insensitive" } },
            { description: { contains: "arroz", mode: "insensitive" } },
          ],
        },
        include: { category: true, market: true },
        take: 20,
      });
      expect(prisma.product.count).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        products: [],
        markets: [],
        categories: [],
      });
    });

    it("should paginate products when page and limit are provided", async () => {
      const req = { query: { q: "arroz", page: "2", limit: "5" } };
      const res = mockRes();
      const mockProducts = [{ id: "1", name: "Arroz" }];

      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.market.findMany.mockResolvedValue([]);
      prisma.category.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(12);

      await searchController.search(req, res);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          available: true,
          OR: [
            { name: { contains: "arroz", mode: "insensitive" } },
            { description: { contains: "arroz", mode: "insensitive" } },
          ],
        },
        include: { category: true, market: true },
        skip: 5,
        take: 5,
      });
      expect(prisma.product.count).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        products: mockProducts,
        markets: [],
        categories: [],
        total: 12,
        page: 2,
        limit: 5,
      });
    });

    it("should include filtered product count in categories", async () => {
      const req = { query: { q: "granos" } };
      const res = mockRes();

      prisma.product.findMany.mockResolvedValue([]);
      prisma.market.findMany.mockResolvedValue([]);
      prisma.category.findMany.mockResolvedValue([]);

      await searchController.search(req, res);

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          name: { contains: "granos", mode: "insensitive" },
        },
        include: {
          _count: {
            select: {
              products: { where: { available: true } },
            },
          },
        },
        take: 10,
      });
    });
  });

  describe("suggest", () => {
    it("should return empty arrays when query is missing", async () => {
      const req = { query: {} };
      const res = mockRes();

      await searchController.suggest(req, res);

      expect(prisma.product.findMany).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        products: [],
        markets: [],
        categories: [],
      });
    });

    it("should return lightweight suggestions with default limit 8", async () => {
      const req = { query: { q: "ar" } };
      const res = mockRes();
      const mockProducts = [{ id: "1", name: "Arroz", price: 500, unit: "kg", image: null }];
      const mockCategories = [{ id: "c1", name: "Granos", icon: "grain" }];
      const mockMarkets = [{ id: "m1", name: "Mercado", location: "Bissau", type: "MERCADO_LOCAL" }];

      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.category.findMany.mockResolvedValue(mockCategories);
      prisma.market.findMany.mockResolvedValue(mockMarkets);

      await searchController.suggest(req, res);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          available: true,
          OR: [
            { name: { contains: "ar", mode: "insensitive" } },
            { description: { contains: "ar", mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          price: true,
          unit: true,
          image: true,
        },
        orderBy: { name: "asc" },
        take: 3,
      });
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 3 }),
      );
      expect(prisma.market.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 2 }),
      );
      expect(res.json).toHaveBeenCalledWith({
        products: mockProducts,
        categories: mockCategories,
        markets: mockMarkets,
      });
    });

    it("should respect custom limit parameter", async () => {
      const req = { query: { q: "aceite", limit: "12" } };
      const res = mockRes();

      prisma.product.findMany.mockResolvedValue([]);
      prisma.category.findMany.mockResolvedValue([]);
      prisma.market.findMany.mockResolvedValue([]);

      await searchController.suggest(req, res);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 7 }),
      );
    });
  });
});
