import prisma from "../config/db.js";
import { AppError, NotFoundError } from "../utils/errors.js";
import {
  approveRefundRequest,
  rejectRefundRequest,
  createAdminManualRefund,
  getRefundSummaryForOrder,
} from "../services/refund.service.js";
import { rescheduleDeliveryAfterFailure } from "../services/deliveryAttempt.service.js";
import { logAdminAction } from "../services/adminAudit.service.js";
import { recordOrderEvent } from "../services/orderEvent.service.js";
import { refundableRemainingFcfa } from "../utils/orderRefunds.js";

export async function listRefundQueue(req, res) {
  const { status = "PENDING", page = 1, limit = 20 } = req.query;
  const where = { status };
  const [data, total] = await Promise.all([
    prisma.refund.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            items: true,
          },
        },
      },
    }),
    prisma.refund.count({ where }),
  ]);
  res.json({ data, total, page: Number(page), limit: Number(limit) });
}

export async function listIncidents(req, res) {
  const { page = 1, limit = 20, status } = req.query;
  const where = {
    status: status
      ? status
      : { in: ["DELIVERY_FAILED_ATTEMPT", "UNDELIVERABLE"] },
  };
  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        delivery: { select: { id: true, name: true } },
        deliveryAttempts: { orderBy: { attemptNumber: "desc" }, take: 3 },
        refunds: { where: { status: "PENDING" }, take: 1 },
      },
    }),
    prisma.order.count({ where }),
  ]);
  res.json({ data, total, page: Number(page), limit: Number(limit) });
}

export async function getOrderRefundSummary(req, res) {
  const summary = await getRefundSummaryForOrder(req.params.id);
  if (!summary) throw new NotFoundError("Pedido");
  res.json(summary);
}

export async function approveRefund(req, res) {
  const refund = await approveRefundRequest({
    refundId: req.params.refundId,
    adminId: req.user.id,
    amountFcfa: req.body.amount,
    adminNote: req.body.adminNote,
    acceptLanguage: req.headers["accept-language"],
  });
  res.json({ refund });
}

export async function rejectRefund(req, res) {
  const refund = await rejectRefundRequest({
    refundId: req.params.refundId,
    adminId: req.user.id,
    adminNote: req.body.adminNote,
    acceptLanguage: req.headers["accept-language"],
  });
  res.json({ refund });
}

export async function manualRefund(req, res) {
  const refund = await createAdminManualRefund({
    orderId: req.params.id,
    adminId: req.user.id,
    amountFcfa: req.body.amount,
    reason: req.body.reason,
    adminNote: req.body.adminNote,
    orderItemIds: req.body.orderItemIds,
    acceptLanguage: req.headers["accept-language"],
    refundToWallet: req.body.refundToWallet === true,
  });
  res.status(201).json({ refund });
}

export async function resolveUndeliverable(req, res) {
  const { outcome, amount, adminNote } = req.body;
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { refunds: true, items: true },
  });
  if (!order) throw new NotFoundError("Pedido");
  if (!["UNDELIVERABLE", "DELIVERY_FAILED_ATTEMPT"].includes(order.status)) {
    throw new AppError("El pedido no está en incidencia de entrega", 400);
  }

  let refund = null;
  if (outcome === "REATTEMPT") {
    await rescheduleDeliveryAfterFailure({
      orderId: order.id,
      actorId: req.user.id,
      actorRole: "ADMIN",
    });
  } else if (outcome === "REFUND_FULL") {
    const remaining = refundableRemainingFcfa(order, order.refunds);
    refund = await createAdminManualRefund({
      orderId: order.id,
      adminId: req.user.id,
      amountFcfa: remaining,
      reason: "UNDELIVERABLE",
      adminNote,
      acceptLanguage: req.headers["accept-language"],
    });
  } else if (outcome === "REFUND_PARTIAL") {
    if (!amount) throw new AppError("Se requiere amount", 400);
    refund = await createAdminManualRefund({
      orderId: order.id,
      adminId: req.user.id,
      amountFcfa: amount,
      reason: "UNDELIVERABLE",
      adminNote,
      acceptLanguage: req.headers["accept-language"],
    });
  } else if (outcome === "CLOSE_NO_REFUND") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "UNDELIVERABLE" },
    });
  }

  await recordOrderEvent({
    orderId: order.id,
    type: "ADMIN_RESOLVE_UNDELIVERABLE",
    actorId: req.user.id,
    actorRole: "ADMIN",
    payload: { outcome, refundId: refund?.id },
  });

  await logAdminAction({
    adminId: req.user.id,
    action: "RESOLVE_UNDELIVERABLE",
    orderId: order.id,
    metadata: { outcome },
  });

  const updated = await prisma.order.findUnique({
    where: { id: order.id },
    include: { items: true, refunds: true, deliveryAttempts: true },
  });

  res.json({ order: updated, refund });
}
