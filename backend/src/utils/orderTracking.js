import prisma from "../config/db.js";
import {
  computeEtaFromRouteDistance,
  estimateRoadDistanceMeters,
  fetchDrivingRoute,
  formatEtaLabelSpanish,
  pickEtaSpeedMps,
} from "./osrmRoute.js";

export const LIVE_TRACKING_STATUSES = ["PICKED_UP", "IN_TRANSIT"];

/** Courier GPS older than this is not considered live. */
export const LIVE_LOCATION_MAX_AGE_MS = 2 * 60 * 1000;

function isIsoDateString(value) {
  if (typeof value !== "string" || !value) return false;
  if (!Number.isFinite(Date.parse(value))) return false;
  return /^\d{4}-\d{2}-\d{2}T/.test(value);
}

function parseOptionalMetric(value, { min = null, max = null } = {}) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (min != null && n < min) return null;
  if (max != null && n > max) return null;
  return n;
}

export function parseDestinationCoordinates(lat, lng) {
  if (lat == null || lng == null) return { lat: null, lng: null };
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    return { lat: null, lng: null };
  }
  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
    return { lat: null, lng: null };
  }
  return { lat: parsedLat, lng: parsedLng };
}

export function isCourierLocationFresh(location, nowMs = Date.now()) {
  if (!location?.updatedAt) return false;
  const updatedMs = Date.parse(location.updatedAt);
  if (!Number.isFinite(updatedMs)) return false;
  return nowMs - updatedMs <= LIVE_LOCATION_MAX_AGE_MS;
}

export function courierLocationAgeSeconds(location, nowMs = Date.now()) {
  if (!location?.updatedAt) return null;
  const updatedMs = Date.parse(location.updatedAt);
  if (!Number.isFinite(updatedMs)) return null;
  return Math.max(0, Math.floor((nowMs - updatedMs) / 1000));
}

/** Buyer-facing GPS signal: LIVE | STALE | NO_GPS (null when order is not in a live-tracking status). */
export function deriveCourierSignalState(inLiveStatus, courierLocation, locationFresh) {
  if (!inLiveStatus) return null;
  if (courierLocation == null) return "NO_GPS";
  if (locationFresh) return "LIVE";
  return "STALE";
}

async function buildRouteAndEta(courierLocation, destination, locationFresh, options = {}) {
  if (
    courierLocation == null ||
    destination.lat == null ||
    destination.lng == null
  ) {
    return { routePolyline: null, etaSeconds: null, etaLabel: null, routeDistanceMeters: null };
  }

  const route =
    (await fetchDrivingRoute(
      courierLocation.lat,
      courierLocation.lng,
      destination.lat,
      destination.lng,
      options,
    )) ?? null;

  const routeDistanceMeters =
    route?.distanceMeters ??
    estimateRoadDistanceMeters(
      courierLocation.lat,
      courierLocation.lng,
      destination.lat,
      destination.lng,
    );

  const speedMps = pickEtaSpeedMps(courierLocation, locationFresh);
  const etaSeconds = computeEtaFromRouteDistance(routeDistanceMeters, speedMps);

  return {
    routePolyline: route?.polyline ?? null,
    routeDistanceMeters,
    etaSeconds,
    etaLabel: formatEtaLabelSpanish(etaSeconds),
  };
}

export function parseDeliveryLocation(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  const heading = parseOptionalMetric(raw.heading, { min: 0, max: 360 });
  const accuracy = parseOptionalMetric(raw.accuracy, { min: 0 });
  const speed = parseOptionalMetric(raw.speed, { min: 0 });

  const location = {
    lat,
    lng,
    updatedAt: isIsoDateString(raw.updatedAt) ? raw.updatedAt : null,
  };
  if (heading != null) location.heading = heading;
  if (accuracy != null) location.accuracy = accuracy;
  if (speed != null) location.speed = speed;
  return location;
}

/**
 * Shared tracking payload for customer + admin map UIs.
 * Returns null if the order does not exist.
 */
export async function getOrderTrackingPayload(orderId, options = {}) {
  const nowMs = options.nowMs ?? Date.now();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      deliveryId: true,
      recipientName: true,
      recipientAddress: true,
      recipientLat: true,
      recipientLng: true,
      delivery: {
        select: {
          id: true,
          name: true,
          deliveryProfile: {
            select: { currentLocation: true, phone: true },
          },
        },
      },
    },
  });

  if (!order) return null;

  const courierLocation = parseDeliveryLocation(
    order.delivery?.deliveryProfile?.currentLocation,
  );

  const destinationCoords = parseDestinationCoordinates(
    order.recipientLat,
    order.recipientLng,
  );

  const inLiveStatus = LIVE_TRACKING_STATUSES.includes(order.status);
  const locationFresh =
    courierLocation != null && isCourierLocationFresh(courierLocation, nowMs);
  const courierSignalState = deriveCourierSignalState(
    inLiveStatus,
    courierLocation,
    locationFresh,
  );

  const routeEta = await buildRouteAndEta(
    courierLocation,
    destinationCoords,
    locationFresh,
    options.routeOptions ?? {},
  );

  return {
    orderId: order.id,
    userId: order.userId,
    status: order.status,
    deliveryId: order.deliveryId,
    deliveryName: order.delivery?.name ?? null,
    deliveryPhone: order.delivery?.deliveryProfile?.phone ?? null,
    destination: {
      name: order.recipientName || null,
      address: order.recipientAddress || null,
      lat: destinationCoords.lat,
      lng: destinationCoords.lng,
    },
    courierLocation,
    courierSignalState,
    lastLocationAt: courierLocation?.updatedAt ?? null,
    lastLocationAgeSeconds: courierLocationAgeSeconds(courierLocation, nowMs),
    isLive: courierSignalState === "LIVE",
    courierLocationStale: courierSignalState === "STALE",
    routePolyline: routeEta.routePolyline,
    routeDistanceMeters: routeEta.routeDistanceMeters,
    etaSeconds: routeEta.etaSeconds,
    etaLabel: routeEta.etaLabel,
  };
}

/** Public JSON: never expose the order owner id. */
export function toPublicTracking(tracking) {
  const publicTracking = { ...tracking };
  delete publicTracking.userId;
  return publicTracking;
}
