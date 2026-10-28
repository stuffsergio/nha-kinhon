import prisma from "../config/db.js";
import { AppError, codedError } from "../utils/errors.js";
import { getStripe, isStripeConfigured } from "./stripe.service.js";
import {
  assertRefundEligibility,
  computeOrderRefundStatus,
  isPreDispatchForCancel,
  orderAmountFcfa,
  refundableRemainingFcfa,
  sumSucceededRefunds,
} from "../utils/orderRefunds.js";
import {
  assertRefundAmountWithinLimit,
  loadOrderWithRefundsTx,
  lockOrderRow,
} from "../utils/refundLock.js";
import { recordOrderEvent } from "./orderEvent.service.js";
import { createNotification } from "./notification.service.js";
import { notifyAllAdmins } from "./adminNotify.service.js";
import { logAdminAction } from "./adminAudit.service.js";
import { isWalletEnabled } from "../config/wallet.js";
import { creditWalletRefund } from "./wallet.service.js";

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

function assertOrderItemIdsBelongToOrder(order, orderItemIds) {
  if (!orderItemIds?.length) return;
  const ids = new Set(order.items.map((i) => i.id));
  for (const lineId of orderItemIds) {
    if (!ids.has(lineId)) {
      throw codedError("REFUND_ORDER_ITEM_INVALID", 400);
    }
  }
}

export async function createBuyerRefundRequest({
  orderId,
  userId,
  reason,
  buyerNote,
  orderItemIds,
  acceptLanguage,
}) {
  const refund = await prisma.$transaction(async (tx) => {
    await lockOrderRow(tx, orderId);
    const order = await loadOrderWithRefundsTx(tx, orderId);
    if (!order) throw new AppError("Pedido no encontrado", 404);
    if (order.userId !== userId) throw new AppError("No tienes permiso", 403);

    assertOrderItemIdsBelongToOrder(order, orderItemIds);

    const eligibility = assertRefundEligibility(order, order.refunds, {
      reason,
      orderItemIds,
      items: order.items,
    });
    if (!eligibility.ok) throw codedError(eligibility.code, 400);

    const amount = eligibility.suggestedAmount;
    assertRefundAmountWithinLimit(order, order.refunds, amount);

    const pendingSame = order.refunds.find(
      (r) => r.status === "PENDING" && r.requestedById === userId,
    );
    if (pendingSame) throw codedError("REFUND_REQUEST_PENDING", 409);

    return tx.refund.create({
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
  });

  await recordOrderEvent({
    orderId,
    type: "REFUND_REQUESTED",
    actorId: userId,
    actorRole: "USER",
    payload: { refundId: refund.id, amount: refund.amount, reason },
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
  const orderId = await prisma.$transaction(async (tx) => {
    const refund = await tx.refund.findUnique({ where: { id: refundId } });
    if (!refund) throw new AppError("Reembolso no encontrado", 404);
    if (refund.status !== "PENDING") throw codedError("REFUND_ALREADY_PROCESSED", 409);

    await lockOrderRow(tx, refund.orderId);
    const order = await loadOrderWithRefundsTx(tx, refund.orderId);
    const amount = amountFcfa != null ? Math.round(amountFcfa) : refund.amount;
    assertRefundAmountWithinLimit(order, order.refunds, amount, {
      excludeRefundId: refundId,
    });

    await tx.refund.update({
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

    return order.id;
  });

  const executed = await executeStripeRefundById(refundId);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (order?.userId) {
    await createNotification({
      userId: order.userId,
      type: "REFUND_APPROVED",
      template: "REFUND_APPROVED",
      templateParams: { shortId: order.id.slice(0, 8) },
      orderId: order.id,
      acceptLanguage,
    });
  }

  return executed;
}

export async function rejectRefundRequest({ refundId, adminId, adminNote, acceptLanguage }) {
  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    include: { order: true },
  });
  if (!refund) throw new AppError("Reembolso no encontrado", 404);
  if (refund.status !== "PENDING") throw codedError("REFUND_ALREADY_PROCESSED", 409);

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
  acceptLanguage: _acceptLanguage,
  refundToWallet = false,
}) {
  const amount = Math.round(amountFcfa);

  const refund = await prisma.$transaction(async (tx) => {
    await lockOrderRow(tx, orderId);
    const order = await loadOrderWithRefundsTx(tx, orderId);
    if (!order) throw new AppError("Pedido no encontrado", 404);

    assertOrderItemIdsBelongToOrder(order, orderItemIds);

    const eligibility = assertRefundEligibility(order, order.refunds, {
      reason: reason || "ADMIN_MANUAL",
      orderItemIds,
      items: order.items,
    });
    if (!eligibility.ok) throw codedError(eligibility.code, 400);

    assertRefundAmountWithinLimit(order, order.refunds, amount);

    const created = await tx.refund.create({
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
      refundId: created.id,
      metadata: { amount },
    });

    return created;
  });

  if (refundToWallet && isWalletEnabled()) {
    return executeWalletRefundById(refund.id, adminId);
  }
  return executeStripeRefundById(refund.id);
}

async function executeWalletRefundById(refundId, adminId) {
  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    include: { order: true },
  });
  if (!refund) throw new AppError("Reembolso no encontrado", 404);
  if (refund.status !== "PENDING") return refund;

  await creditWalletRefund({
    userId: refund.order.userId,
    amountMinor: refund.amount,
    orderId: refund.orderId,
    idempotencyKey: `refund-${refund.id}`,
    adminId,
  });

  const updated = await prisma.refund.update({
    where: { id: refund.id },
    data: { status: "SUCCEEDED" },
  });

  await recordOrderEvent({
    orderId: refund.orderId,
    type: "REFUND_COMPLETED",
    actorId: adminId,
    actorRole: "ADMIN",
    payload: { refundId: refund.id, destination: "wallet" },
  });

  await createNotification({
    userId: refund.order.userId,
    type: "REFUND_COMPLETED",
    template: "REFUND_COMPLETED",
    templateParams: { shortId: refund.orderId.slice(0, 8) },
    orderId: refund.orderId,
  });

  return updated;
}

async function executeStripeRefundById(refundId) {
  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    include: { order: { include: { items: true, refunds: true } } },
  });
  if (!refund) throw new AppError("Reembolso no encontrado", 404);
  if (refund.status !== "PENDING") return refund;

  const order = refund.order;
  if (order.stripePaymentId?.startsWith("wallet:") && isWalletEnabled()) {
    return executeWalletRefundById(refundId, refund.approvedById);
  }

  if (!isStripeConfigured()) throw codedError("STRIPE_NOT_CONFIGURED", 503);
  let stripeRefund;
  try {
    const paymentRef = await resolvePaymentIntentId(order);
    const stripe = getStripe();
    stripeRefund = await stripe.refunds.create(
      {
        payment_intent: paymentRef,
        amount: refund.amount,
        metadata: { orderId: order.id, refundId: refund.id },
      },
      { idempotencyKey: `nha-refund-${refund.id}` },
    );
  } catch (err) {
    await prisma.refund.update({
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

  const finalized = await finalizeRefundFromStripeObject(refund.id, stripeRefund);

  if (finalized?.status === "SUCCEEDED" && order.userId) {
    await createNotification({
      userId: order.userId,
      type: "REFUND_COMPLETED",
      template: "REFUND_COMPLETED",
      templateParams: { shortId: order.id.slice(0, 8) },
      orderId: order.id,
    });
  }

  return finalized;
}

export async function finalizeRefundFromStripeObject(refundId, stripeRefundObject) {
  const status =
    stripeRefundObject.status === "succeeded"
      ? "SUCCEEDED"
      : stripeRefundObject.status === "failed"
        ? "FAILED"
        : stripeRefundObject.status === "canceled"
          ? "CANCELED"
          : "PENDING";

  const pre = await prisma.refund.findUnique({
    where: { id: refundId },
    select: { orderId: true },
  });
  if (!pre) return null;

  return prisma.$transaction(async (tx) => {
    await lockOrderRow(tx, pre.orderId);

    const refund = await tx.refund.findUnique({ where: { id: refundId } });
    if (!refund) return null;

    if (refund.status === "SUCCEEDED" && status === "SUCCEEDED") {
      return refund;
    }

    const updated = await tx.refund.update({
      where: { id: refundId },
      data: {
        stripeRefundId: stripeRefundObject.id,
        status,
        amount: stripeRefundObject.amount ?? refund.amount,
      },
    });

    if (status === "SUCCEEDED") {
      await reconcileOrderAfterRefund(tx, updated.orderId);
      await recordOrderEvent({
        orderId: updated.orderId,
        type: "REFUND_STRIPE_CREATED",
        payload: { refundId, stripeRefundId: stripeRefundObject.id },
      });
    }

    return updated;
  });
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

  if (order.status !== "CANCELLED" || nextStatus === "REFUNDED") {
    await tx.order.update({
      where: { id: orderId },
      data: { status: nextStatus },
    });
  }

  await recordOrderEvent({
    orderId,
    type: "REFUND_COMPLETED",
    payload: { succeededTotal: succeeded, orderStatus: nextStatus },
  });
}

async function findOrderIdForStripeRefund(stripeRefundObject) {
  const metaOrderId = stripeRefundObject.metadata?.orderId;
  if (metaOrderId) return metaOrderId;

  const pi = stripeRefundObject.payment_intent;
  if (typeof pi === "string") {
    const byPi = await prisma.order.findFirst({ where: { stripePaymentId: pi } });
    if (byPi) return byPi.id;
  }

  return null;
}

export async function applyStripeRefundWebhook({ stripeRefundObject, eventType }) {
  if (!stripeRefundObject?.id?.startsWith("re_")) return null;

  return prisma.$transaction(async (tx) => {
    let refund =
      stripeRefundObject.metadata?.refundId
        ? await tx.refund.findUnique({ where: { id: stripeRefundObject.metadata.refundId } })
        : null;

    if (!refund) {
      refund = await tx.refund.findFirst({
        where: { stripeRefundId: stripeRefundObject.id },
      });
    }

    if (refund) {
      await lockOrderRow(tx, refund.orderId);
      return applyStripeRefundToExisting(tx, refund, stripeRefundObject, eventType);
    }

    const orderId = await findOrderIdForStripeRefund(stripeRefundObject);
    if (!orderId) return null;

    await lockOrderRow(tx, orderId);
    const order = await loadOrderWithRefundsTx(tx, orderId);
    const amount = Math.round(stripeRefundObject.amount || 0);
    assertRefundAmountWithinLimit(order, order.refunds, amount);

    const created = await tx.refund.create({
      data: {
        orderId,
        amount,
        status: "PENDING",
        stripeRefundId: stripeRefundObject.id,
        reason: "ADMIN_MANUAL",
        adminNote: "Stripe Dashboard / webhook externo",
      },
    });

    return applyStripeRefundToExisting(tx, created, stripeRefundObject, eventType);
  });
}

async function applyStripeRefundToExisting(tx, refund, stripeRefundObject, eventType) {
  let status = refund.status;
  if (stripeRefundObject.status === "succeeded") status = "SUCCEEDED";
  else if (stripeRefundObject.status === "failed") status = "FAILED";
  else if (stripeRefundObject.status === "canceled") status = "CANCELED";
  else if (eventType === "refund.failed") status = "FAILED";

  if (status === "SUCCEEDED" && refund.status !== "SUCCEEDED") {
    const order = await loadOrderWithRefundsTx(tx, refund.orderId);
    const amount = Math.round(stripeRefundObject.amount ?? refund.amount);
    assertRefundAmountWithinLimit(order, order.refunds, amount, {
      excludeRefundId: refund.id,
    });
  }

  const updated = await tx.refund.update({
    where: { id: refund.id },
    data: {
      stripeRefundId: stripeRefundObject.id,
      status,
      amount: stripeRefundObject.amount ?? refund.amount,
    },
  });

  const order = await tx.order.findUnique({ where: { id: updated.orderId } });

  if (status === "SUCCEEDED") {
    await reconcileOrderAfterRefund(tx, updated.orderId);
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
  }

  return updated;
}

export async function cancelOrderWithAutoRefund({ order, userId, acceptLanguage }) {
  const result = await prisma.$transaction(async (tx) => {
    await lockOrderRow(tx, order.id);
    const fresh = await loadOrderWithRefundsTx(tx, order.id);
    if (!fresh) throw new AppError("Pedido no encontrado", 404);
    if (fresh.userId !== userId) throw codedError("ORDER_FORBIDDEN", 403);

    if (fresh.status === "CANCELLED") {
      const existing = fresh.refunds.find(
        (r) => r.reason === "CANCEL_BEFORE_DISPATCH" && r.status !== "CANCELED",
      );
      return { kind: "idempotent", refund: existing ?? null, order: fresh };
    }

    if (!isPreDispatchForCancel(fresh)) {
      throw codedError("REFUND_CANCEL_NOT_ELIGIBLE", 400);
    }

    const remaining = refundableRemainingFcfa(fresh, fresh.refunds);
    if (remaining <= 0) throw codedError("REFUND_NOTHING_LEFT", 400);

    await tx.order.update({
      where: { id: fresh.id },
      data: { status: "CANCELLED" },
    });

    const refund = await tx.refund.create({
      data: {
        orderId: fresh.id,
        amount: remaining,
        reason: "CANCEL_BEFORE_DISPATCH",
        requestedById: userId,
        approvedById: userId,
        status: "PENDING",
      },
    });

    await recordOrderEvent({
      orderId: fresh.id,
      type: "ORDER_CANCELLED_AUTO_REFUND",
      actorId: userId,
      actorRole: "USER",
      payload: { refundId: refund.id },
    });

    return { kind: "created", refund, order: fresh };
  });

  if (result.kind === "idempotent") {
    return result.refund;
  }

  const executed = await executeStripeRefundById(result.refund.id);

  await createNotification({
    userId,
    type: "ORDER_CANCELLED",
    template: "ORDER_CANCELLED",
    templateParams: { shortId: order.id.slice(0, 8) },
    orderId: order.id,
    acceptLanguage,
  });

  return executed;
}
