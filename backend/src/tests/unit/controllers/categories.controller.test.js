import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../config/db.js", () => ({
  default: {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}));

import prisma from "../../../config/db.js";
import * as categoriesController from "../../../controllers/categories.controller.js";

function mockRes() {
  return { json: vi.fn(), status: vi.fn().mockReturnThis() };
}

describe("categories controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should count only available products", async () => {
      const req = { query: {} };
      const res = mockRes();
      const mockCategories = [
        { id: "1", name: "Granos", _count: { products: 4 } },
      ];

      prisma.category.findMany.mockResolvedValue(mockCategories);

      await categoriesController.list(req, res);

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { active: true },
        include: {
          _count: {
            select: {
              products: { where: { available: true } },
            },
          },
        },
      });
      expect(res.json).toHaveBeenCalledWith({ data: mockCategories });
    });
  });
});
