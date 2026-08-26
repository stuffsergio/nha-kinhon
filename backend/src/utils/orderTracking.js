import prisma from "../config/db.js";

const LIVE_TRACKING_STATUSES = ["PICKED_UP", "IN_TRANSIT"];

function isIsoDateString(value) {
  if (typeof value !== "string" || !value) return false;
  if (!Number.isFinite(Date.parse(value))) return false;
  return /^\d{4}-\d{2}-\d{2}T/.test(value);
}

export function parseDeliveryLocation(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return {
    lat,
    lng,
    updatedAt: isIsoDateString(raw.updatedAt) ? raw.updatedAt : null,
  };
}

/**
 * Shared tracking payload for customer + admin map UIs.
 * Returns null if the order does not exist.
 */
export async function getOrderTrackingPayload(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      deliveryId: true,
      recipientName: true,
      recipientAddress: true,
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
      lat: null,
      lng: null,
    },
    courierLocation,
    isLive: LIVE_TRACKING_STATUSES.includes(order.status) && courierLocation != null,
  };
}

/** Public JSON: never expose the order owner id. */
export function toPublicTracking(tracking) {
  const publicTracking = { ...tracking };
  delete publicTracking.userId;
  return publicTracking;
}
