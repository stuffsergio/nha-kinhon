import { describe, it, expect, vi } from "vitest";
import { requireAdmin } from "../../../middleware/admin.js";

describe("requireAdmin middleware", () => {
  it("should throw if user role is not ADMIN", () => {
    const req = { user: { role: "USER" } };
    expect(() => requireAdmin(req, {}, () => {})).toThrow(
      "Se requieren permisos de administrador"
    );
  });

  it("should throw if user is undefined", () => {
    const req = {};
    expect(() => requireAdmin(req, {}, () => {})).toThrow(
      "Se requieren permisos de administrador"
    );
  });

  it("should call next if user is ADMIN", () => {
    const req = { user: { role: "ADMIN" } };
    const next = vi.fn();
    requireAdmin(req, {}, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
