import prisma from "../config/db.js";
import { AppError, NotFoundError, codedError } from "../utils/errors.js";
import { parseRecipientCoordinatesFromBody } from "../utils/recipientCoordinates.js";
import { isPreDispatchForCancel } from "../utils/orderRefunds.js";
import { isUnpaidOrderStatus } from "../utils/orderPayment.js";
import {
  createBuyerRefundRequest,
  cancelOrderWithAutoRefund,
} from "../services/refund.service.js";
import {
  rescheduleDeliveryAfterFailure,
} from "../services/deliveryAttempt.service.js";
import { recordOrderEvent } from "../services/orderEvent.service.js";
import { BUYER_RESOLUTION_WINDOW_HOURS } from "../config/refundsDelivery.js";

function assertBuyerResolutionWindow(order) {
  if (!order.buyerResolutionDeadline) return;
  if (new Date() > new Date(order.buyerResolutionDeadline)) {
    throw codedError("BUYER_RESOLUTION_WINDOW_CLOSED", 400);
  }
}

export async function getOrderHistory(req, res) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    select: { id: true, userId: true },
  });
  if (!order) throw new NotFoundError("Pedido");
  if (order.userId !== req.user.id && req.user.role !== "ADMIN") {
    throw codedError("ORDER_VIEW_FORBIDDEN", 403);
  }

  const [attempts, events, refunds] = await Promise.all([
    prisma.deliveryAttempt.findMany({
      where: { orderId: req.params.id },
      orderBy: { createdAt: "asc" },
      include: {
        photos: { select: { id: true, url: true, createdAt: true } },
      },
    }),
    prisma.orderEvent.findMany({
      where: { orderId: req.params.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.refund.findMany({
      where: { orderId: req.params.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  res.json({ attempts, events, refunds, buyerResolutionWindowHours: BUYER_RESOLUTION_WINDOW_HOURS });
}

export async function updateRecipient(req, res) {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new NotFoundError("Pedido");
  if (order.userId !== req.user.id) throw codedError("ORDER_FORBIDDEN", 403);

  if (!["DELIVERY_FAILED_ATTEMPT", "UNDELIVERABLE"].includes(order.status)) {
    throw codedError("RECIPIENT_UPDATE_NOT_ALLOWED", 400);
  }
  assertBuyerResolutionWindow(order);

  const { recipientName, recipientPhone, recipientAddress } = req.body;
  const coords = parseRecipientCoordinatesFromBody(req.body);

  const data = {};
  if (recipientName !== undefined) data.recipientName = recipientName;
  if (recipientPhone !== undefined) data.recipientPhone = recipientPhone;
  if (recipientAddress !== undefined) data.recipientAddress = recipientAddress;
  if (coords.recipientLat != null) {
    data.recipientLat = coords.recipientLat;
    data.recipientLng = coords.recipientLng;
  }

  if (Object.keys(data).length === 0) {
    throw new AppError("No hay campos para actualizar", 400);
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data,
    include: { items: true, delivery: { select: { id: true, name: true } } },
  });

  await recordOrderEvent({
    orderId: order.id,
    type: "BUYER_RECIPIENT_UPDATED",
    actorId: req.user.id,
    actorRole: "USER",
    payload: { fields: Object.keys(data) },
  });

  res.json({ order: updated });
}

export async function requestReattempt(req, res) {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new NotFoundError("Pedido");
  if (order.userId !== req.user.id) throw codedError("ORDER_FORBIDDEN", 403);
  assertBuyerResolutionWindow(order);

  const updated = await rescheduleDeliveryAfterFailure({
    orderId: order.id,
    actorId: req.user.id,
    actorRole: "USER",
  });

  res.json({ order: updated });
}

export async function requestRefund(req, res) {
  const { reason, buyerNote, orderItemIds } = req.body;
  const refund = await createBuyerRefundRequest({
    orderId: req.params.id,
    userId: req.user.id,
    reason,
    buyerNote,
    orderItemIds,
    acceptLanguage: req.headers["accept-language"],
  });
  res.status(201).json({ refund });
}

export async function cancelWithRefund(req, res) {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new NotFoundError("Pedido");
  if (order.userId !== req.user.id) throw codedError("ORDER_FORBIDDEN", 403);

  if (isUnpaidOrderStatus(order.status)) {
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    return res.json({ order: updated, refund: null });
  }

  if (order.status === "DELIVERY_FAILED_ATTEMPT" || order.status === "UNDELIVERABLE") {
    assertBuyerResolutionWindow(order);
    await recordOrderEvent({
      orderId: order.id,
      type: "BUYER_CANCEL_REQUEST_REFUND",
      actorId: req.user.id,
      actorRole: "USER",
    });
    const refund = await createBuyerRefundRequest({
      orderId: order.id,
      userId: req.user.id,
      reason: "UNDELIVERABLE",
      buyerNote: req.body?.buyerNote,
      acceptLanguage: req.headers["accept-language"],
    });
    return res.status(201).json({ refund });
  }

  if (!isPreDispatchForCancel(order)) {
    throw codedError("ORDER_CANCEL_UNPAID_ONLY", 400);
  }

  const refund = await cancelOrderWithAutoRefund({
    order,
    userId: req.user.id,
    acceptLanguage: req.headers["accept-language"],
  });
  const updated = await prisma.order.findUnique({
    where: { id: order.id },
    include: { items: true },
  });
  res.json({ order: updated, refund });
}
