import { describe, it, expect, vi, beforeEach } from "vitest";
import { validate } from "../../../middleware/validate.js";
import { z } from "zod";

describe("validate middleware", () => {
  const schema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
  });

  it("should throw ValidationError on invalid data", () => {
    const middleware = validate(schema);
    const req = { body: { name: "", email: "notanemail" } };
    expect(() => middleware(req, {}, () => {})).toThrow("name: Name is required; email: Invalid email");
  });

  it("should call next and set req.body on valid data", () => {
    const middleware = validate(schema);
    const req = { body: { name: "John", email: "john@test.com" } };
    const next = vi.fn();
    middleware(req, {}, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: "John", email: "john@test.com" });
  });
});
