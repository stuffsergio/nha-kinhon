import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../config/db.js", () => ({
  default: {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}));

import prisma from "../../../config/db.js";
import * as productsController from "../../../controllers/products.controller.js";

function mockRes() {
  return { json: vi.fn(), status: vi.fn().mockReturnThis() };
}

describe("products controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should default to available products only", async () => {
      const req = { query: {} };
      const res = mockRes();

      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await productsController.list(req, res);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { available: true },
        skip: 0,
        take: 20,
        include: { category: true, market: true },
        orderBy: { name: "asc" },
      });
    });

    it("should accept q as alias for search in name and description", async () => {
      const req = { query: { q: "arroz" } };
      const res = mockRes();

      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await productsController.list(req, res);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          available: true,
          OR: [
            { name: { contains: "arroz", mode: "insensitive" } },
            { description: { contains: "arroz", mode: "insensitive" } },
          ],
        },
        skip: 0,
        take: 20,
        include: { category: true, market: true },
        orderBy: { name: "asc" },
      });
    });

    it("should sort products by price descending", async () => {
      const req = { query: { sort: "price_desc" } };
      const res = mockRes();

      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await productsController.list(req, res);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: "desc" },
        }),
      );
    });

    it("should allow listing unavailable products with available=false", async () => {
      const req = { query: { available: "false" } };
      const res = mockRes();

      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await productsController.list(req, res);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { available: false },
        }),
      );
    });

    it("should allow listing all products with available=all", async () => {
      const req = { query: { available: "all" } };
      const res = mockRes();

      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await productsController.list(req, res);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });
  });
});
