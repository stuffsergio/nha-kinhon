import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../config/db.js", () => ({
  default: {
    market: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}));

import prisma from "../../../config/db.js";
import * as marketsController from "../../../controllers/markets.controller.js";

function mockRes() {
  return { json: vi.fn(), status: vi.fn().mockReturnThis() };
}

describe("markets controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should return paginated markets", async () => {
      const req = { query: {} };
      const res = mockRes();
      const mockData = [
        { id: 1, name: "Market A", _count: { products: 5 } },
        { id: 2, name: "Market B", _count: { products: 3 } },
      ];

      prisma.market.findMany.mockResolvedValue(mockData);
      prisma.market.count.mockResolvedValue(2);

      await marketsController.list(req, res);

      expect(prisma.market.findMany).toHaveBeenCalledWith({
        where: { active: true },
        skip: 0,
        take: 20,
        include: { _count: { select: { products: true } } },
      });
      expect(res.json).toHaveBeenCalledWith({
        data: mockData,
        total: 2,
        page: 1,
        limit: 20,
      });
    });

    it("should filter by type and location", async () => {
      const req = { query: { type: "supermarket", location: "Bissau" } };
      const res = mockRes();

      prisma.market.findMany.mockResolvedValue([]);
      prisma.market.count.mockResolvedValue(0);

      await marketsController.list(req, res);

      expect(prisma.market.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          type: "supermarket",
          location: { contains: "Bissau", mode: "insensitive" },
        },
        skip: 0,
        take: 20,
        include: { _count: { select: { products: true } } },
      });
    });
  });

  describe("getById", () => {
    it("should return market with products and categories", async () => {
      const req = { params: { id: "1" } };
      const res = mockRes();
      const mockMarket = {
        id: "1",
        name: "Market A",
        active: true,
        products: [
          { id: 1, name: "Product 1", category: { id: 1, name: "Cat 1" } },
        ],
      };

      prisma.market.findUnique.mockResolvedValue(mockMarket);

      await marketsController.getById(req, res);

      expect(prisma.market.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
        include: {
          products: { where: { available: true }, include: { category: true } },
        },
      });
      expect(res.json).toHaveBeenCalledWith({ market: mockMarket });
    });

    it("should throw NotFoundError if market does not exist", async () => {
      const req = { params: { id: "999" } };
      const res = mockRes();

      prisma.market.findUnique.mockResolvedValue(null);

      await expect(marketsController.getById(req, res)).rejects.toThrow(
        "Mercado no encontrado"
      );
    });

    it("should throw NotFoundError if market is not active", async () => {
      const req = { params: { id: "1" } };
      const res = mockRes();

      prisma.market.findUnique.mockResolvedValue({
        id: "1",
        active: false,
      });

      await expect(marketsController.getById(req, res)).rejects.toThrow(
        "Mercado no encontrado"
      );
    });
  });
});
