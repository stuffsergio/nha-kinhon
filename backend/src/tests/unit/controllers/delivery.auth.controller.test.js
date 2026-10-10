import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../config/db.js", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    deliveryProfile: {
      create: vi.fn(),
    },
  },
}));

vi.mock("../../../utils/jwt.js", () => ({
  signAccessToken: vi.fn(() => "access-token"),
  signRefreshToken: vi.fn(() => "refresh-token"),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(async () => "hashed"),
    compare: vi.fn(async () => true),
  },
}));

import prisma from "../../../config/db.js";
import { signAccessToken } from "../../../utils/jwt.js";
import * as deliveryAuthController from "../../../controllers/delivery.auth.controller.js";

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    cookie: vi.fn(),
  };
}

describe("delivery auth controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("includes locale in JWT payload and login response", async () => {
      const req = {
        body: { email: "joao@example.com", password: "123456" },
        headers: { "accept-language": "pt-PT" },
      };
      const res = mockRes();

      prisma.user.findUnique.mockResolvedValue({
        id: "d1",
        name: "João",
        email: "joao@example.com",
        role: "DELIVERY",
        password: "hashed",
        locale: "pov",
      });
      prisma.user.update.mockResolvedValue({});

      await deliveryAuthController.login(req, res);

      expect(signAccessToken).toHaveBeenCalledWith({
        id: "d1",
        role: "DELIVERY",
        locale: "pov",
      });
      expect(res.json).toHaveBeenCalledWith({
        user: {
          id: "d1",
          name: "João",
          email: "joao@example.com",
          role: "DELIVERY",
          locale: "pov",
        },
        accessToken: "access-token",
      });
    });
  });
});
