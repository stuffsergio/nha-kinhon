import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";

vi.mock("../../../config/db.js", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}));

vi.mock("../../../utils/jwt.js", () => ({
  signAccessToken: vi.fn(() => "mock-access-token"),
  signRefreshToken: vi.fn(() => "mock-refresh-token"),
  verifyToken: vi.fn(),
}));

import prisma from "../../../config/db.js";
import { signAccessToken, signRefreshToken, verifyToken } from "../../../utils/jwt.js";
import * as authController from "../../../controllers/auth.controller.js";

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  };
  return res;
}

describe("auth controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("should create user and return tokens", async () => {
      const req = {
        body: { name: "Test", email: "test@test.com", password: "123456" },
      };
      const res = mockRes();

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 1,
        name: "Test",
        email: "test@test.com",
        role: "USER",
        password: "hashed",
      });

      await authController.register(req, res);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@test.com" },
      });
      expect(prisma.user.create).toHaveBeenCalledOnce();
      expect(signAccessToken).toHaveBeenCalledWith({ id: 1, role: "USER" });
      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "mock-refresh-token",
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        user: { id: 1, name: "Test", email: "test@test.com", role: "USER" },
        accessToken: "mock-access-token",
      });
    });

    it("should throw if email already exists", async () => {
      const req = {
        body: { name: "Test", email: "exists@test.com", password: "123456" },
      };
      const res = mockRes();

      prisma.user.findUnique.mockResolvedValue({ id: 2 });

      await expect(authController.register(req, res)).rejects.toThrow(
        "El email ya está registrado"
      );
    });
  });

  describe("login", () => {
    const mockUser = {
      id: 1,
      name: "Test",
      email: "test@test.com",
      password: "hashed",
      role: "USER",
      balance: 0,
      phone: null,
      avatar: null,
    };

    it("should return tokens on valid credentials", async () => {
      const req = {
        body: { email: "test@test.com", password: "123456" },
      };
      const res = mockRes();

      prisma.user.findUnique.mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, "compare").mockResolvedValue(true);

      await authController.login(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "mock-refresh-token",
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith({
        user: {
          id: 1,
          name: "Test",
          email: "test@test.com",
          role: "USER",
          balance: 0,
          phone: null,
          avatar: null,
        },
        accessToken: "mock-access-token",
      });
    });

    it("should throw if user not found", async () => {
      const req = {
        body: { email: "nonexistent@test.com", password: "123456" },
      };
      const res = mockRes();

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authController.login(req, res)).rejects.toThrow(
        "Credenciales incorrectas"
      );
    });

    it("should throw if password is wrong", async () => {
      const req = {
        body: { email: "test@test.com", password: "wrong" },
      };
      const res = mockRes();

      prisma.user.findUnique.mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, "compare").mockResolvedValue(false);

      await expect(authController.login(req, res)).rejects.toThrow(
        "Credenciales incorrectas"
      );
    });
  });

  describe("getMe", () => {
    it("should return user data", async () => {
      const req = { user: { id: 1 } };
      const res = mockRes();
      const userData = {
        id: 1,
        name: "Test",
        email: "test@test.com",
        phone: null,
        avatar: null,
        balance: 0,
        role: "USER",
        createdAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(userData);

      await authController.getMe(req, res);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.any(Object),
      });
      expect(res.json).toHaveBeenCalledWith({ user: userData });
    });

    it("should throw if user not found", async () => {
      const req = { user: { id: 999 } };
      const res = mockRes();

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authController.getMe(req, res)).rejects.toThrow(
        "Usuario no encontrado"
      );
    });
  });

  describe("logout", () => {
    it("should clear refresh token and cookie", async () => {
      const req = { user: { id: 1 } };
      const res = mockRes();

      await authController.logout(req, res);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { refreshToken: null },
      });
      expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      expect(res.json).toHaveBeenCalledWith({ message: "Sesión cerrada" });
    });
  });
});
