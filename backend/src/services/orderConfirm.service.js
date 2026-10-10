import prisma from "../config/db.js";
import { isUnpaidOrderStatus } from "../utils/orderPayment.js";
import { createNotification } from "../services/notification.service.js";
import { assertPaymentIntentMatchesOrder } from "./stripe.service.js";

/**
 * Marks order CONFIRMED after verified payment (webhook or client fallback).
 * Idempotent if already confirmed with same payment id.
 */
export async function finalizeOrderAsPaid({ orderId, userId, stripePaymentId, paymentIntentForValidation }) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;

  if (!isUnpaidOrderStatus(order.status)) {
    if (order.status === "CONFIRMED") {
      return order;
    }
    return null;
  }

  if (paymentIntentForValidation) {
    assertPaymentIntentMatchesOrder(paymentIntentForValidation, order);
  }

  const data = { status: "CONFIRMED" };
  if (stripePaymentId) data.stripePaymentId = stripePaymentId;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data,
    include: { items: true },
  });

  const ownerId = userId || order.userId;
  await prisma.cartItem.deleteMany({ where: { userId: ownerId } });

  await createNotification({
    userId: order.userId,
    type: "ORDER_CONFIRMED",
    template: "ORDER_PAYMENT_CONFIRMED",
    templateParams: { shortId: orderId.slice(0, 8) },
    orderId,
  });

  return updated;
}
