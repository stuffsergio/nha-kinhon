import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { brotliJson } from "../../../middleware/brotliJson.js";

describe("brotliJson middleware", () => {
  it("compresses large JSON when Accept-Encoding includes br", async () => {
    const app = express();
    app.use(brotliJson({ threshold: 32 }));
    app.get("/ping", (_req, res) => {
      res.json({ ok: true, pad: "x".repeat(256) });
    });

    const res = await request(app)
      .get("/ping")
      .set("Accept-Encoding", "br")
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-encoding"]).toBe("br");
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
