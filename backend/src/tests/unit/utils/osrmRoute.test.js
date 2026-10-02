import { describe, it, expect, vi } from "vitest";
import {
  computeEtaFromRouteDistance,
  estimateRoadDistanceMeters,
  fetchDrivingRoute,
  formatEtaLabelSpanish,
  pickEtaSpeedMps,
  DEFAULT_URBAN_SPEED_MPS,
} from "../../../utils/osrmRoute.js";

describe("fetchDrivingRoute", () => {
  it("returns polyline and distance on success", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: "Ok",
        routes: [
          {
            distance: 1500,
            duration: 240,
            geometry: {
              coordinates: [
                [-15.59, 11.86],
                [-15.597, 11.865],
              ],
            },
          },
        ],
      }),
    });

    const route = await fetchDrivingRoute(11.86, -15.59, 11.865, -15.597, { fetchFn });
    expect(route).toEqual({
      distanceMeters: 1500,
      durationSeconds: 240,
      polyline: [
        [11.86, -15.59],
        [11.865, -15.597],
      ],
    });
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it("returns null when OSRM fails", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("network"));
    expect(await fetchDrivingRoute(1, 2, 3, 4, { fetchFn })).toBeNull();
  });
});

describe("pickEtaSpeedMps", () => {
  it("uses fresh courier speed when sensible", () => {
    expect(pickEtaSpeedMps({ speed: 6 }, true)).toBe(6);
  });

  it("falls back to urban default when stale or speed out of range", () => {
    expect(pickEtaSpeedMps({ speed: 6 }, false)).toBe(DEFAULT_URBAN_SPEED_MPS);
    expect(pickEtaSpeedMps({ speed: 0.5 }, true)).toBe(DEFAULT_URBAN_SPEED_MPS);
    expect(pickEtaSpeedMps({}, true)).toBe(DEFAULT_URBAN_SPEED_MPS);
  });
});

describe("computeEtaFromRouteDistance", () => {
  it("computes seconds from distance and speed", () => {
    expect(computeEtaFromRouteDistance(800, 8)).toBe(100);
  });
});

describe("formatEtaLabelSpanish", () => {
  it("formats minute labels", () => {
    expect(formatEtaLabelSpanish(45)).toBe("Menos de 1 min");
    expect(formatEtaLabelSpanish(90)).toBe("~2 min");
  });
});

describe("estimateRoadDistanceMeters", () => {
  it("is at least straight-line distance", () => {
    const d = estimateRoadDistanceMeters(11.863, -15.598, 11.87, -15.59);
    expect(d).toBeGreaterThan(500);
  });
});
