import prisma from "../config/db.js";
import { AppError, NotFoundError, codedError } from "../utils/errors.js";
import { t } from "../i18n/index.js";
import { createNotification } from "../services/notification.service.js";
import {
  applyDefaultOrderListFilter,
  isUnpaidOrderStatus,
} from "../utils/orderPayment.js";
import { getOrderTrackingPayload } from "../utils/orderTracking.js";
import { formatTrackingHttpBody, wantsLeanTracking } from "../utils/trackingFormat.js";
import { parseRecipientCoordinatesFromBody } from "../utils/recipientCoordinates.js";
import { buildOrderReceipt } from "../utils/orderReceipt.js";
import { allowUnverifiedPaymentConfirm } from "../config/runtime.js";
import { isStripeConfigured, assertStripePaymentSucceededForOrder } from "../services/stripe.service.js";
import { finalizeOrderAsPaid } from "../services/orderConfirm.service.js";

export async function listMyOrders(req, res) {
  const { page = 1, limit = 20, status } = req.query;
  const where = applyDefaultOrderListFilter({ userId: req.user.id }, status);

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: Number(limit),
      include: {
        items: true,
        delivery: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ data, total, page: Number(page), limit: Number(limit) });
}

const orderDetailInclude = {
  items: { include: { product: true } },
  delivery: { select: { id: true, name: true } },
  deliveryPhotos: { orderBy: { createdAt: "asc" }, select: { id: true, url: true, createdAt: true } },
};

export async function getById(req, res) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: orderDetailInclude,
  });

  if (!order) throw new NotFoundError("Pedido");
  if (order.userId !== req.user.id && req.user.role !== "ADMIN") {
    throw codedError("ORDER_VIEW_FORBIDDEN", 403);
  }

  res.json({ order });
}

export async function getReceipt(req, res) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });

  if (!order) throw new NotFoundError("Pedido");
  if (order.userId !== req.user.id && req.user.role !== "ADMIN") {
    throw codedError("RECEIPT_FORBIDDEN", 403);
  }

  res.json(buildOrderReceipt(order, req.locale));
}

export async function listDeliveryPhotos(req, res) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    select: { id: true, userId: true, deliveryPhoto: true },
  });

  if (!order) throw new NotFoundError("Pedido");
  if (order.userId !== req.user.id && req.user.role !== "ADMIN") {
    throw new AppError("No tienes permiso para ver las fotos de entrega", 403);
  }

  const photos = await prisma.orderDeliveryPhoto.findMany({
    where: { orderId: req.params.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, url: true, createdAt: true },
  });

  res.json({ photos, legacyPhoto: order.deliveryPhoto || null });
}

async function assertCanViewTracking(req, tracking) {
  if (tracking.userId !== req.user.id && req.user.role !== "ADMIN") {
    throw new AppError("No tienes permiso para ver el seguimiento", 403);
  }

  if (req.user.role !== "ADMIN" && isUnpaidOrderStatus(tracking.status)) {
    throw new AppError("El seguimiento estará disponible tras confirmar el pago", 400);
  }
}

/** Mapa de seguimiento: el dueño del pedido (o admin) puede consultar la ubicación del repartidor. */
export async function getTracking(req, res) {
  const tracking = await getOrderTrackingPayload(req.params.id);
  if (!tracking) throw new NotFoundError("Pedido");

  await assertCanViewTracking(req, tracking);

  res.json(formatTrackingHttpBody(tracking, { lean: wantsLeanTracking(req) }));
}

/** Variante ligera (misma autorización que getTracking). */
export async function getTrackingLean(req, res) {
  const tracking = await getOrderTrackingPayload(req.params.id);
  if (!tracking) throw new NotFoundError("Pedido");

  await assertCanViewTracking(req, tracking);

  res.json(formatTrackingHttpBody(tracking, { lean: true }));
}

export async function checkout(req, res) {
  const { recipientName, recipientPhone, recipientAddress, notes } = req.body;
  const recipientCoords = parseRecipientCoordinatesFromBody(req.body);

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: req.user.id },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    throw new AppError("El carrito está vacío", 400);
  }

  let subtotal = 0;
  const orderItemsData = cartItems.map((ci) => {
    const price = ci.product.price;
    subtotal += price * ci.quantity;
    return {
      productId: ci.product.id,
      name: ci.product.name,
      price,
      quantity: ci.quantity,
    };
  });

  const shipping = 0;
  const total = subtotal + shipping;

  // Borrador: no vaciar carrito ni exponer en listados hasta pago confirmado
  const orderData = {
    userId: req.user.id,
    status: "PENDING_PAYMENT",
    subtotal,
    shipping,
    total,
    notes,
    recipientName,
    recipientPhone,
    recipientAddress,
    items: { createMany: { data: orderItemsData } },
  };
  if (recipientCoords.recipientLat != null) {
    orderData.recipientLat = recipientCoords.recipientLat;
    orderData.recipientLng = recipientCoords.recipientLng;
  }

  const order = await prisma.order.create({
    data: orderData,
    include: { items: true },
  });

  res.status(201).json({ order });
}

/**
 * Confirma un pedido tras pago exitoso (cliente o fallback sin webhook).
 * Preferible: webhook Stripe payment_intent.succeeded / checkout.session.completed.
 */
export async function confirmAfterPayment(req, res) {
  const { id } = req.params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new NotFoundError("Pedido");
  if (order.userId !== req.user.id) throw new AppError("No tienes permiso", 403);
  if (!isUnpaidOrderStatus(order.status)) {
    if (order.status === "CONFIRMED") {
      const current = await prisma.order.findUnique({
        where: { id },
        include: { items: true },
      });
      return res.json({ order: current });
    }
    throw new AppError("El pedido no está pendiente de pago", 400);
  }

  let stripePaymentId = order.stripePaymentId;

  if (isStripeConfigured()) {
    const verified = await assertStripePaymentSucceededForOrder(order);
    stripePaymentId = verified.stripePaymentId;
  } else if (!allowUnverifiedPaymentConfirm()) {
    throw new AppError(
      "La confirmación manual de pago no está disponible. Usa Stripe o contacta con soporte.",
      403,
    );
  }

  const updated = await finalizeOrderAsPaid({
    orderId: id,
    userId: req.user.id,
    stripePaymentId,
  });

  if (!updated) {
    throw new AppError("No se pudo confirmar el pedido", 400);
  }

  res.json({ order: updated });
}

export async function updateStatus(req, res) {
  const { status } = req.body;

  const validTransitions = {
    PENDING_PAYMENT: ["CONFIRMED", "CANCELLED"],
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["CANCELLED"],
    DELIVERED: [],
    CANCELLED: [],
  };

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new NotFoundError("Pedido");

  if (!validTransitions[order.status]?.includes(status)) {
    throw new AppError(
      `No se puede cambiar de ${order.status} a ${status}`,
      400
    );
  }

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
    include: { items: true },
  });

  if (status === "CONFIRMED" || status === "CANCELLED") {
    const statusKey = status === "CONFIRMED" ? "confirmed" : "cancelled";
    await createNotification({
      userId: order.userId,
      type: `ORDER_${status}`,
      template: status === "CANCELLED" ? "ORDER_CANCELLED" : "ORDER_CONFIRMED",
      templateParams: {
        shortId: order.id.slice(0, 8),
        statusLabel: t(`orderStatusShort.${statusKey}`, "es"),
      },
      orderId: order.id,
    });
  }

  if (status === "CONFIRMED") {
    await prisma.cartItem.deleteMany({ where: { userId: order.userId } });
  }

  res.json({ order: updated });
}

export async function cancel(req, res) {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });

  if (!order) throw new NotFoundError("Pedido");
  if (order.userId !== req.user.id) {
    throw new AppError("No puedes cancelar un pedido que no te pertenece", 403);
  }
  if (!isUnpaidOrderStatus(order.status)) {
    throw new AppError("Solo se pueden cancelar pedidos pendientes de pago", 400);
  }

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: "CANCELLED" },
  });

  await createNotification({
    userId: order.userId,
    type: "ORDER_CANCELLED",
    template: "ORDER_CANCELLED",
    templateParams: { shortId: order.id.slice(0, 8) },
    orderId: order.id,
  });

  res.json({ order: updated });
}

export async function listAll(req, res) {
  const { page = 1, limit = 20, status, userId, dateFrom, dateTo } = req.query;
  const where = applyDefaultOrderListFilter({}, status);

  if (userId) where.userId = userId;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: Number(limit),
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true } },
        delivery: { select: { id: true, name: true } },
        deliveryPhotos: {
          orderBy: { createdAt: "asc" },
          select: { id: true, url: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ data, total, page: Number(page), limit: Number(limit) });
}
