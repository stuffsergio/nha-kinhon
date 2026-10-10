import prisma from "../config/db.js";
import { createNotification } from "./notification.service.js";
import {
  COURIER_NEARBY_THRESHOLD_METERS,
  haversineDistanceMeters,
} from "../utils/geo.js";

/**
 * When courier GPS updates, notify buyers once if the courier is near the recipient.
 */
export async function checkAndNotifyCourierNearby(deliveryUserId, lat, lng) {
  const orders = await prisma.order.findMany({
    where: {
      deliveryId: deliveryUserId,
      status: "IN_TRANSIT",
      courierNearbyNotifiedAt: null,
      recipientLat: { not: null },
      recipientLng: { not: null },
    },
    select: {
      id: true,
      userId: true,
      recipientLat: true,
      recipientLng: true,
    },
  });

  for (const order of orders) {
    const distance = haversineDistanceMeters(
      lat,
      lng,
      order.recipientLat,
      order.recipientLng,
    );
    if (distance > COURIER_NEARBY_THRESHOLD_METERS) continue;

    const updated = await prisma.order.updateMany({
      where: { id: order.id, courierNearbyNotifiedAt: null },
      data: { courierNearbyNotifiedAt: new Date() },
    });
    if (updated.count === 0) continue;

    await createNotification({
      userId: order.userId,
      type: "ORDER_COURIER_NEARBY",
      template: "ORDER_COURIER_NEARBY",
      templateParams: { shortId: order.id.slice(0, 8) },
      orderId: order.id,
    });
  }
}
