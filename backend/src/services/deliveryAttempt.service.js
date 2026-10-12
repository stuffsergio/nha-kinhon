import prisma from "../config/db.js";
import { AppError, codedError } from "../utils/errors.js";
import { BUYER_RESOLUTION_WINDOW_HOURS } from "../config/refundsDelivery.js";
import {
  canRecordDeliveryFailure,
  resolveStatusAfterFailure,
} from "../utils/deliveryFailure.js";
import {
  assertValidDeliveryPhotoUrl,
  normalizePhotoList,
  MAX_PHOTOS_PER_REQUEST,
  MAX_PHOTOS_PER_ORDER,
} from "../utils/deliveryPhoto.js";
import { recordOrderEvent } from "./orderEvent.service.js";
import { createNotification } from "./notification.service.js";
import { notifyAllAdmins } from "./adminNotify.service.js";
import { lockOrderRow } from "../utils/refundLock.js";

function buyerDeadlineFromNow() {
  const d = new Date();
  d.setHours(d.getHours() + BUYER_RESOLUTION_WINDOW_HOURS);
  return d;
}

export function assertBuyerResolutionWindow(order) {
  if (!order.buyerResolutionDeadline) return;
  if (new Date() > new Date(order.buyerResolutionDeadline)) {
    throw codedError("BUYER_RESOLUTION_WINDOW_CLOSED", 400);
  }
}

export async function recordFailedDeliveryAttempt({
  orderId,
  courierId,
  reason,
  note,
  lat,
  lng,
  photosRaw,
}) {
  const photoList = photosRaw ? normalizePhotoList(photosRaw) : [];
  if (photoList.length > MAX_PHOTOS_PER_REQUEST) {
    throw new AppError(`Máximo ${MAX_PHOTOS_PER_REQUEST} fotos por solicitud`, 400);
  }

  const { attempt, nextStatus, orderUserId } = await prisma.$transaction(async (tx) => {
    await lockOrderRow(tx, orderId);
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError("Pedido no encontrado", 404);
    if (order.deliveryId !== courierId) {
      throw new AppError("Este pedido no te pertenece", 403);
    }
    if (!canRecordDeliveryFailure(order.status)) {
      throw codedError("DELIVERY_FAILURE_STATUS_INVALID", 400);
    }

    const existingPhotos = await tx.orderDeliveryPhoto.count({ where: { orderId } });
    if (existingPhotos + photoList.length > MAX_PHOTOS_PER_ORDER) {
      throw new AppError(`Máximo ${MAX_PHOTOS_PER_ORDER} fotos por pedido`, 400);
    }

    const attemptNumber = order.failedDeliveryAttempts + 1;
    const nextStatus = resolveStatusAfterFailure({
      reason,
      failedAttemptsAfter: attemptNumber,
    });

    const createdAttempt = await tx.deliveryAttempt.create({
      data: {
        orderId,
        attemptNumber,
        reason,
        note: note ?? null,
        lat: lat ?? null,
        lng: lng ?? null,
        recordedById: courierId,
      },
    });

    for (const raw of photoList) {
      const url = assertValidDeliveryPhotoUrl(raw);
      await tx.orderDeliveryPhoto.create({
        data: {
          orderId,
          url,
          uploadedById: courierId,
          deliveryAttemptId: createdAttempt.id,
        },
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        failedDeliveryAttempts: attemptNumber,
        status: nextStatus,
        buyerResolutionDeadline: buyerDeadlineFromNow(),
      },
    });

    return { attempt: createdAttempt, nextStatus, orderUserId: order.userId };
  });

  await recordOrderEvent({
    orderId,
    type: "DELIVERY_FAILED",
    actorId: courierId,
    actorRole: "DELIVERY",
    payload: {
      attemptId: attempt.id,
      reason,
      attemptNumber: attempt.attemptNumber,
      nextStatus,
    },
  });

  const shortId = orderId.slice(0, 8);
  await createNotification({
    userId: orderUserId,
    type: nextStatus === "UNDELIVERABLE" ? "ORDER_UNDELIVERABLE" : "ORDER_DELIVERY_FAILED",
    template: nextStatus === "UNDELIVERABLE" ? "ORDER_UNDELIVERABLE" : "ORDER_DELIVERY_FAILED",
    templateParams: { shortId },
    orderId,
  });

  if (nextStatus === "UNDELIVERABLE") {
    await notifyAllAdmins({
      type: "ADMIN_UNDELIVERABLE",
      template: "ADMIN_UNDELIVERABLE",
      templateParams: { shortId },
      orderId,
    });
  }

  return { attempt, nextStatus };
}

export async function rescheduleDeliveryAfterFailure({ orderId, actorId, actorRole }) {
  const updated = await prisma.$transaction(async (tx) => {
    await lockOrderRow(tx, orderId);
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError("Pedido no encontrado", 404);
    if (order.status !== "DELIVERY_FAILED_ATTEMPT") {
      throw codedError("DELIVERY_REATTEMPT_INVALID", 400);
    }
    assertBuyerResolutionWindow(order);

    return tx.order.update({
      where: { id: orderId },
      data: { status: "IN_TRANSIT" },
    });
  });

  await recordOrderEvent({
    orderId,
    type: "BUYER_REQUEST_REATTEMPT",
    actorId,
    actorRole,
    payload: {},
  });

  return updated;
}
