import { AppError } from "./errors.js";
import { parseDeliveryLocation } from "./orderTracking.js";

export const MAX_LOCATION_BATCH_SIZE = 64;

function parsePointFromBody(body, { index = null } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    if (index == null) throw new AppError("Se requieren lat y lng numéricos", 400);
    return null;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    if (index == null) throw new AppError("Coordenadas fuera de rango", 400);
    return null;
  }

  const parsed = parseDeliveryLocation({
    lat,
    lng,
    updatedAt: body.updatedAt,
    heading: body.heading,
    accuracy: body.accuracy,
    speed: body.speed,
  });
  if (!parsed) return null;

  const updatedAtMs = parsed.updatedAt ? Date.parse(parsed.updatedAt) : Date.now();
  if (!Number.isFinite(updatedAtMs)) return null;

  return {
    ...parsed,
    updatedAt: parsed.updatedAt ?? new Date(updatedAtMs).toISOString(),
    updatedAtMs,
  };
}

/**
 * Normalizes PUT /delivery/location body into ordered GPS points (oldest first).
 * Supports legacy single-point bodies and `{ points: [...] }` batches.
 */
export function parseLocationIngestBody(body) {
  if (body?.points != null) {
    if (!Array.isArray(body.points)) {
      throw new AppError("points debe ser un array", 400);
    }
    if (body.points.length === 0) {
      throw new AppError("Se requiere al menos un punto GPS", 400);
    }
    if (body.points.length > MAX_LOCATION_BATCH_SIZE) {
      throw new AppError(`Máximo ${MAX_LOCATION_BATCH_SIZE} puntos por solicitud`, 400);
    }

    const parsed = [];
    for (let i = 0; i < body.points.length; i += 1) {
      const point = parsePointFromBody(body.points[i], { index: i });
      if (!point) {
        throw new AppError(`Punto GPS inválido en índice ${i}`, 400);
      }
      parsed.push(point);
    }
    parsed.sort((a, b) => a.updatedAtMs - b.updatedAtMs);
    return parsed;
  }

  const single = parsePointFromBody(body);
  if (!single) {
    throw new AppError("Se requieren lat y lng numéricos", 400);
  }
  if (single.updatedAt == null) {
    single.updatedAt = new Date().toISOString();
    single.updatedAtMs = Date.parse(single.updatedAt);
  }
  return [single];
}

function storedLocationTimestampMs(currentLocation) {
  const stored = parseDeliveryLocation(currentLocation);
  if (!stored?.updatedAt) return null;
  const ms = Date.parse(stored.updatedAt);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Applies points in timestamp order. Skips points older than stored location (idempotent replay).
 * Returns the location persisted on profile (may be unchanged).
 */
export function mergeLocationBatch(currentLocation, points) {
  let latest = parseDeliveryLocation(currentLocation);
  let latestMs = storedLocationTimestampMs(currentLocation);
  let appliedCount = 0;
  let skippedOlder = 0;

  for (const point of points) {
    if (latestMs != null && point.updatedAtMs < latestMs) {
      skippedOlder += 1;
      continue;
    }
    if (latestMs != null && point.updatedAtMs === latestMs) {
      skippedOlder += 1;
      continue;
    }
    latest = {
      lat: point.lat,
      lng: point.lng,
      updatedAt: point.updatedAt,
    };
    if (point.heading != null) latest.heading = point.heading;
    if (point.accuracy != null) latest.accuracy = point.accuracy;
    if (point.speed != null) latest.speed = point.speed;
    latestMs = point.updatedAtMs;
    appliedCount += 1;
  }

  return {
    location: latest,
    appliedCount,
    skippedOlder,
    changed: appliedCount > 0,
  };
}
