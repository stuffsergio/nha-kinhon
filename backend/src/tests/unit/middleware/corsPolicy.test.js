import { describe, it, expect, vi, afterEach } from "vitest";
import express from "express";
import request from "supertest";

describe("corsPolicy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function buildApp() {
    vi.doMock("../../../config/env.js", () => ({
      default: { CLIENT_URL: "https://app.example" },
    }));
    const { corsMiddleware } = await import("../../../middleware/corsPolicy.js");
    const app = express();
    app.use(corsMiddleware());
    app.get("/api/health", (_req, res) => {
      res.json({ status: "ok" });
    });
    return app;
  }

  it("allows requests without Origin (native app)", async () => {
    const app = await buildApp();
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("allows nhakinhon:// deep link origin", async () => {
    const app = await buildApp();
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "nhakinhon://");
    expect(res.status).toBe(200);
  });
});
