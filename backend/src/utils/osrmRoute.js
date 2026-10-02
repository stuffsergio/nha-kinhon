import { haversineDistanceMeters } from "./geo.js";

/** Fallback urban driving speed when GPS speed is missing or not trustworthy (m/s). */
export const DEFAULT_URBAN_SPEED_MPS = 25 / 3.6; // ~25 km/h

const ROAD_DISTANCE_FACTOR = 1.35;

const DEFAULT_OSRM_BASE = "https://router.project-osrm.org";

function geoJsonToLatLngRing(geometry) {
  if (!geometry?.coordinates?.length) return null;
  return geometry.coordinates.map(([lng, lat]) => [lat, lng]);
}

/**
 * Fetches a driving route from OSRM. Returns null on failure (network, no route).
 * @param {typeof fetch} [fetchFn]
 */
export async function fetchDrivingRoute(
  lat1,
  lng1,
  lat2,
  lng2,
  { fetchFn = globalThis.fetch, osrmBase = process.env.OSRM_URL || DEFAULT_OSRM_BASE } = {},
) {
  const url = `${osrmBase.replace(/\/$/, "")}/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
  let response;
  try {
    response = await fetchFn(url, { signal: AbortSignal.timeout(8000) });
  } catch {
    return null;
  }
  if (!response.ok) return null;

  let body;
  try {
    body = await response.json();
  } catch {
    return null;
  }

  if (body.code !== "Ok" || !body.routes?.[0]) return null;

  const route = body.routes[0];
  const polyline = geoJsonToLatLngRing(route.geometry);
  if (!polyline?.length) return null;

  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    polyline,
  };
}

export function estimateRoadDistanceMeters(lat1, lng1, lat2, lng2) {
  const straight = haversineDistanceMeters(lat1, lng1, lat2, lng2);
  return straight * ROAD_DISTANCE_FACTOR;
}

export function pickEtaSpeedMps(courierLocation, locationFresh) {
  if (locationFresh && courierLocation?.speed != null) {
    const s = Number(courierLocation.speed);
    if (Number.isFinite(s) && s >= 1 && s <= 22) return s;
  }
  return DEFAULT_URBAN_SPEED_MPS;
}

export function computeEtaFromRouteDistance(distanceMeters, speedMps) {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) return null;
  if (!Number.isFinite(speedMps) || speedMps <= 0) return null;
  return Math.max(1, Math.round(distanceMeters / speedMps));
}

export function formatEtaLabelSpanish(etaSeconds) {
  if (etaSeconds == null) return null;
  if (etaSeconds < 60) return "Menos de 1 min";
  const minutes = Math.round(etaSeconds / 60);
  if (minutes === 1) return "~1 min";
  return `~${minutes} min`;
}
