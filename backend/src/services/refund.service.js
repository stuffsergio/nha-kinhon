import prisma from "../config/db.js";
import { AppError, codedError } from "../utils/errors.js";
import { getStripe, isStripeConfigured } from "./stripe.service.js";
import {
  assertRefundEligibility,
  computeOrderRefundStatus,
  orderAmountFcfa,
  refundableRemainingFcfa,
  sumSucceededRefunds,
} from "../utils/orderRefunds.js";
import { recordOrderEvent } from "./orderEvent.service.js";
import { createNotification } from "./notification.service.js";
import { notifyAllAdmins } from "./adminNotify.service.js";
import { logAdminAction } from "./adminAudit.service.js";

async function loadOrderWithRefunds(orderId) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      refunds: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getRefundSummaryForOrder(orderId) {
  const order = await loadOrderWithRefunds(orderId);
  if (!order) return null;
  const succeeded = sumSucceededRefunds(order.refunds);
  const remaining = refundableRemainingFcfa(order, order.refunds);
  return {
    orderTotal: orderAmountFcfa(order),
    refundedSucceeded: succeeded,
    refundableRemaining: remaining,
    refunds: order.refunds,
  };
}

export async function createBuyerRefundRequest({
  orderId,
  userId,
  reason,
  buyerNote,
  orderItemIds,
  acceptLanguage,
}) {
  const order = await loadOrderWithRefunds(orderId);
  if (!order) throw new AppError("Pedido no encontrado", 404);
  if (order.userId !== userId) throw new AppError("No tienes permiso", 403);

  const eligibility = assertRefundEligibility(order, order.refunds, {
    reason,
    orderItemIds,
    items: order.items,
  });
  if (!eligibility.ok) {
    throw codedError(eligibility.code, 400);
  }

  const amount = eligibility.suggestedAmount;
  if (amount <= 0 || amount > eligibility.maxAmount) {
    throw codedError("REFUND_AMOUNT_INVALID", 400);
  }

  const pendingSame = order.refunds.find(
    (r) => r.status === "PENDING" && r.requestedById === userId,
  );
  if (pendingSame) {
    throw codedError("REFUND_REQUEST_PENDING", 409);
  }

  const refund = await prisma.refund.create({
    data: {
      orderId,
      amount,
      reason,
      requestedById: userId,
      buyerNote: buyerNote ?? null,
      orderItemIds: orderItemIds?.length ? orderItemIds : undefined,
      status: "PENDING",
    },
  });

  await recordOrderEvent({
    orderId,
    type: "REFUND_REQUESTED",
    actorId: userId,
    actorRole: "USER",
    payload: { refundId: refund.id, amount, reason },
  });

  await createNotification({
    userId,
    type: "REFUND_REQUESTED",
    template: "REFUND_REQUESTED",
    templateParams: { shortId: orderId.slice(0, 8) },
    orderId,
    acceptLanguage,
  });

  await notifyAllAdmins({
    type: "ADMIN_REFUND_REQUEST",
    template: "ADMIN_REFUND_REQUEST",
    templateParams: { shortId: orderId.slice(0, 8) },
    orderId,
    acceptLanguage,
  });

  return refund;
}

export async function approveRefundRequest({
  refundId,
  adminId,
  amountFcfa,
  adminNote,
  acceptLanguage,
}) {
  return prisma.$transaction(async (tx) => {
    const refund = await tx.refund.findUnique({
      where: { id: refundId },
      include: { order: { include: { items: true, refunds: true } } },
    });
    if (!refund) throw new AppError("Reembolso no encontrado", 404);
    if (refund.status !== "PENDING") {
      throw codedError("REFUND_ALREADY_PROCESSED", 409);
    }

    const order = refund.order;
    const remaining = refundableRemainingFcfa(order, order.refunds);
    const amount = amountFcfa != null ? Math.round(amountFcfa) : refund.amount;
    if (amount <= 0 || amount > remaining) {
      throw codedError("REFUND_AMOUNT_INVALID", 400);
    }

    const updated = await tx.refund.update({
      where: { id: refundId },
      data: {
        amount,
        approvedById: adminId,
        adminNote: adminNote ?? null,
      },
    });

    await recordOrderEvent({
      orderId: order.id,
      type: "REFUND_APPROVED",
      actorId: adminId,
      actorRole: "ADMIN",
      payload: { refundId, amount },
    });

    await logAdminAction({
      adminId,
      action: "REFUND_APPROVE",
      orderId: order.id,
      refundId,
      metadata: { amount },
    });

    const stripeRefund = await executeStripeRefund({
      tx,
      order,
      refund: updated,
    });

    if (order.userId) {
      await createNotification({
        userId: order.userId,
        type: "REFUND_APPROVED",
        template: "REFUND_APPROVED",
        templateParams: { shortId: order.id.slice(0, 8) },
        orderId: order.id,
        acceptLanguage,
      });
    }

    return stripeRefund;
  });
}

export async function rejectRefundRequest({ refundId, adminId, adminNote, acceptLanguage }) {
  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    include: { order: true },
  });
  if (!refund) throw new AppError("Reembolso no encontrado", 404);
  if (refund.status !== "PENDING") {
    throw codedError("REFUND_ALREADY_PROCESSED", 409);
  }

  const updated = await prisma.refund.update({
    where: { id: refundId },
    data: {
      status: "CANCELED",
      rejectedById: adminId,
      adminNote: adminNote ?? null,
    },
  });

  await recordOrderEvent({
    orderId: refund.orderId,
    type: "REFUND_REJECTED",
    actorId: adminId,
    actorRole: "ADMIN",
    payload: { refundId },
  });

  await logAdminAction({
    adminId,
    action: "REFUND_REJECT",
    orderId: refund.orderId,
    refundId,
  });

  if (refund.order?.userId) {
    await createNotification({
      userId: refund.order.userId,
      type: "REFUND_REJECTED",
      template: "REFUND_REJECTED",
      templateParams: { shortId: refund.orderId.slice(0, 8) },
      orderId: refund.orderId,
      acceptLanguage,
    });
  }

  return updated;
}

export async function createAdminManualRefund({
  orderId,
  adminId,
  amountFcfa,
  reason,
  adminNote,
  orderItemIds,
  acceptLanguage,
}) {
  const order = await loadOrderWithRefunds(orderId);
  if (!order) throw new AppError("Pedido no encontrado", 404);

  const eligibility = assertRefundEligibility(order, order.refunds, {
    reason: reason || "ADMIN_MANUAL",
    orderItemIds,
    items: order.items,
  });
  if (!eligibility.ok) {
    throw codedError(eligibility.code, 400);
  }

  const amount = Math.round(amountFcfa);
  if (amount <= 0 || amount > eligibility.maxAmount) {
    throw codedError("REFUND_AMOUNT_INVALID", 400);
  }

  return prisma.$transaction(async (tx) => {
    const refund = await tx.refund.create({
      data: {
        orderId,
        amount,
        reason: reason || "ADMIN_MANUAL",
        approvedById: adminId,
        requestedById: adminId,
        adminNote: adminNote ?? null,
        orderItemIds: orderItemIds?.length ? orderItemIds : undefined,
        status: "PENDING",
      },
    });

    await logAdminAction({
      adminId,
      action: "REFUND_MANUAL",
      orderId,
      refundId: refund.id,
      metadata: { amount },
    });

    return executeStripeRefund({ tx, order, refund });
  });
}

export async function executeStripeRefund({ tx, order, refund }) {
  if (!isStripeConfigured()) {
    throw codedError("STRIPE_NOT_CONFIGURED", 503);
  }

  const paymentRef = await resolvePaymentIntentId(order);
  const stripe = getStripe();

  let stripeRefund;
  try {
    stripeRefund = await stripe.refunds.create(
      {
        payment_intent: paymentRef,
        amount: refund.amount,
        metadata: { orderId: order.id, refundId: refund.id },
      },
      { idempotencyKey: `nha-refund-${refund.id}` },
    );
  } catch (err) {
    await tx.refund.update({
      where: { id: refund.id },
      data: { status: "FAILED" },
    });
    await recordOrderEvent({
      orderId: order.id,
      type: "REFUND_FAILED",
      payload: { refundId: refund.id, error: err.message },
    });
    throw codedError("REFUND_STRIPE_FAILED", 502);
  }

  const updated = await tx.refund.update({
    where: { id: refund.id },
    data: {
      stripeRefundId: stripeRefund.id,
      status: stripeRefund.status === "succeeded" ? "SUCCEEDED" : "PENDING",
    },
  });

  await recordOrderEvent({
    orderId: order.id,
    type: "REFUND_STRIPE_CREATED",
    payload: { refundId: refund.id, stripeRefundId: stripeRefund.id },
  });

  if (stripeRefund.status === "succeeded") {
    await reconcileOrderAfterRefund(tx, order.id);
  }

  return updated;
}

async function resolvePaymentIntentId(order) {
  const ref = order.stripePaymentId;
  if (!ref) throw new AppError("Pedido sin referencia de pago", 400);

  if (ref.startsWith("pi_")) return ref;

  if (ref.startsWith("cs_")) {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(ref, { expand: ["payment_intent"] });
    const pi = session.payment_intent;
    const id = typeof pi === "string" ? pi : pi?.id;
    if (!id) throw new AppError("No se encontró PaymentIntent", 400);
    return id;
  }

  throw new AppError("Referencia de pago desconocida", 400);
}

export async function reconcileOrderAfterRefund(tx, orderId) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { refunds: true },
  });
  if (!order) return;

  const succeeded = sumSucceededRefunds(order.refunds);
  const nextStatus = computeOrderRefundStatus(orderAmountFcfa(order), succeeded);
  if (!nextStatus) return;

  await tx.order.update({
    where: { id: orderId },
    data: { status: nextStatus },
  });

  await recordOrderEvent({
    orderId,
    type: "REFUND_COMPLETED",
    payload: { succeededTotal: succeeded, orderStatus: nextStatus },
  });
}

export async function applyStripeRefundWebhook({ stripeRefundObject, eventType }) {
  const refundId = stripeRefundObject.metadata?.refundId;
  let refund = refundId
    ? await prisma.refund.findUnique({ where: { id: refundId } })
    : null;

  if (!refund && stripeRefundObject.id) {
    refund = await prisma.refund.findFirst({
      where: { stripeRefundId: stripeRefundObject.id },
    });
  }

  if (!refund) {
    const orderId = stripeRefundObject.metadata?.orderId;
    if (!orderId) return null;
    refund = await prisma.refund.create({
      data: {
        orderId,
        amount: stripeRefundObject.amount || 0,
        status: "PENDING",
        stripeRefundId: stripeRefundObject.id,
        reason: "ADMIN_MANUAL",
      },
    });
  }

  let status = refund.status;
  if (stripeRefundObject.status === "succeeded") status = "SUCCEEDED";
  else if (stripeRefundObject.status === "failed") status = "FAILED";
  else if (stripeRefundObject.status === "canceled") status = "CANCELED";
  else if (eventType === "refund.failed") status = "FAILED";

  const updated = await prisma.refund.update({
    where: { id: refund.id },
    data: {
      stripeRefundId: stripeRefundObject.id,
      status,
      amount: stripeRefundObject.amount ?? refund.amount,
    },
  });

  const order = await prisma.order.findUnique({ where: { id: updated.orderId } });
  if (status === "SUCCEEDED") {
    await prisma.$transaction(async (tx) => {
      await reconcileOrderAfterRefund(tx, updated.orderId);
    });
    if (order?.userId) {
      await createNotification({
        userId: order.userId,
        type: "REFUND_COMPLETED",
        template: "REFUND_COMPLETED",
        templateParams: { shortId: order.id.slice(0, 8) },
        orderId: order.id,
      });
    }
  } else if (status === "FAILED") {
    await recordOrderEvent({
      orderId: updated.orderId,
      type: "REFUND_FAILED",
      payload: { refundId: updated.id, eventType },
    });
    if (order?.userId) {
      await createNotification({
        userId: order.userId,
        type: "REFUND_FAILED",
        template: "REFUND_FAILED",
        templateParams: { shortId: order.id.slice(0, 8) },
        orderId: order.id,
      });
    }
  }

  return updated;
}

export async function cancelOrderWithAutoRefund({ order, userId, acceptLanguage }) {
  const withRefunds = await loadOrderWithRefunds(order.id);
  const remaining = refundableRemainingFcfa(withRefunds, withRefunds.refunds);
  if (remaining <= 0) {
    throw codedError("REFUND_NOTHING_LEFT", 400);
  }

  return prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });

    const refund = await tx.refund.create({
      data: {
        orderId: order.id,
        amount: remaining,
        reason: "CANCEL_BEFORE_DISPATCH",
        requestedById: userId,
        approvedById: userId,
        status: "PENDING",
      },
    });

    await recordOrderEvent({
      orderId: order.id,
      type: "ORDER_CANCELLED_AUTO_REFUND",
      actorId: userId,
      actorRole: "USER",
      payload: { refundId: refund.id },
    });

    const executed = await executeStripeRefund({ tx, order: withRefunds, refund });

    await createNotification({
      userId,
      type: "ORDER_CANCELLED",
      template: "ORDER_CANCELLED",
      templateParams: { shortId: order.id.slice(0, 8) },
      orderId: order.id,
      acceptLanguage,
    });

    return executed;
  });
}
