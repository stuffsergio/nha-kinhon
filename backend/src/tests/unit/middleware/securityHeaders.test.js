import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { securityHeaders } from "../../../middleware/securityHeaders.js";

describe("securityHeaders middleware", () => {
  it("sets X-Frame-Options and Referrer-Policy", async () => {
    const app = express();
    app.use(securityHeaders());
    app.get("/ping", (_req, res) => res.json({ ok: true }));

    const res = await request(app).get("/ping");
    expect(res.headers["x-frame-options"]).toBe("DENY");
    expect(res.headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});
