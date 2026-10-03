import { describe, it, expect } from "vitest";
import {
  mergeLocationBatch,
  parseLocationIngestBody,
  MAX_LOCATION_BATCH_SIZE,
} from "../../../utils/deliveryLocationIngest.js";

describe("parseLocationIngestBody", () => {
  it("parses legacy single-point body", () => {
    const points = parseLocationIngestBody({ lat: 11.86, lng: -15.59 });
    expect(points).toHaveLength(1);
    expect(points[0].lat).toBe(11.86);
    expect(points[0].updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("sorts batch points by updatedAt", () => {
    const points = parseLocationIngestBody({
      points: [
        { lat: 2, lng: 2, updatedAt: "2026-01-02T00:00:00.000Z" },
        { lat: 1, lng: 1, updatedAt: "2026-01-01T00:00:00.000Z" },
      ],
    });
    expect(points.map((p) => p.lat)).toEqual([1, 2]);
  });

  it("rejects empty batch", () => {
    expect(() => parseLocationIngestBody({ points: [] })).toThrow(/al menos un punto/);
  });

  it("rejects oversized batch", () => {
    const points = Array.from({ length: MAX_LOCATION_BATCH_SIZE + 1 }, (_, i) => ({
      lat: 11 + i * 0.001,
      lng: -15,
      updatedAt: `2026-01-01T00:00:${String(i).padStart(2, "0")}.000Z`,
    }));
    expect(() => parseLocationIngestBody({ points })).toThrow(/Máximo/);
  });
});

describe("mergeLocationBatch", () => {
  it("applies newest point from batch on empty profile", () => {
    const result = mergeLocationBatch(null, [
      {
        lat: 1,
        lng: 1,
        updatedAt: "2026-01-01T00:00:00.000Z",
        updatedAtMs: Date.parse("2026-01-01T00:00:00.000Z"),
      },
      {
        lat: 2,
        lng: 2,
        updatedAt: "2026-01-02T00:00:00.000Z",
        updatedAtMs: Date.parse("2026-01-02T00:00:00.000Z"),
      },
    ]);
    expect(result.changed).toBe(true);
    expect(result.appliedCount).toBe(2);
    expect(result.location).toMatchObject({ lat: 2, lng: 2 });
  });

  it("skips older points idempotently", () => {
    const stored = {
      lat: 5,
      lng: 5,
      updatedAt: "2026-01-05T00:00:00.000Z",
    };
    const result = mergeLocationBatch(stored, [
      {
        lat: 1,
        lng: 1,
        updatedAt: "2026-01-01T00:00:00.000Z",
        updatedAtMs: Date.parse("2026-01-01T00:00:00.000Z"),
      },
      {
        lat: 6,
        lng: 6,
        updatedAt: "2026-01-06T00:00:00.000Z",
        updatedAtMs: Date.parse("2026-01-06T00:00:00.000Z"),
      },
    ]);
    expect(result.skippedOlder).toBe(1);
    expect(result.appliedCount).toBe(1);
    expect(result.location.lat).toBe(6);
  });

  it("returns unchanged when all points are stale", () => {
    const stored = {
      lat: 5,
      lng: 5,
      updatedAt: "2026-01-05T00:00:00.000Z",
    };
    const result = mergeLocationBatch(stored, [
      {
        lat: 1,
        lng: 1,
        updatedAt: "2026-01-01T00:00:00.000Z",
        updatedAtMs: Date.parse("2026-01-01T00:00:00.000Z"),
      },
    ]);
    expect(result.changed).toBe(false);
    expect(result.appliedCount).toBe(0);
    expect(result.location.lat).toBe(5);
  });
});
