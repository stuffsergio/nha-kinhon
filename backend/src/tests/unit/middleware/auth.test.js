import { describe, it, expect, vi, beforeEach } from "vitest";
import { authenticate } from "../../../middleware/auth.js";

vi.mock("../../../utils/jwt.js", () => ({
  verifyToken: vi.fn(),
}));

import { verifyToken } from "../../../utils/jwt.js";

function mockReq(headers = {}) {
  return { headers };
}

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe("authenticate middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw if no authorization header", () => {
    const req = mockReq({});
    const res = mockRes();
    expect(() => authenticate(req, res, () => {})).toThrow(
      "Token no proporcionado"
    );
  });

  it("should throw if header does not start with Bearer", () => {
    const req = mockReq({ authorization: "Basic token123" });
    const res = mockRes();
    expect(() => authenticate(req, res, () => {})).toThrow(
      "Token no proporcionado"
    );
  });

  it("should throw if token is invalid", () => {
    verifyToken.mockImplementation(() => {
      throw new Error("jwt malformed");
    });
    const req = mockReq({ authorization: "Bearer invalidtoken" });
    const res = mockRes();
    expect(() => authenticate(req, res, () => {})).toThrow(
      "Token inválido o expirado"
    );
  });

  it("should set req.user and call next on valid token", () => {
    const decoded = { id: 1, role: "USER" };
    verifyToken.mockReturnValue(decoded);
    const req = mockReq({ authorization: "Bearer validtoken" });
    const res = mockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalledOnce();
  });
});
