import prisma from "../config/db.js";
import { AppError, NotFoundError } from "../utils/errors.js";
import { createNotification } from "../services/notification.service.js";
import {
  applyDefaultOrderListFilter,
  isUnpaidOrderStatus,
} from "../utils/orderPayment.js";

export async function listMyOrders(req, res) {
  const { page = 1, limit = 20, status } = req.query;
  const where = applyDefaultOrderListFilter({ userId: req.user.id }, status);

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: Number(limit),
      include: { items: true, delivery: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ data, total, page: Number(page), limit: Number(limit) });
}

export async function getById(req, res) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: true } }, delivery: { select: { id: true, name: true } } },
  });

  if (!order) throw new NotFoundError("Pedido");
  if (order.userId !== req.user.id && req.user.role !== "ADMIN") {
    throw new AppError("No tienes permiso para ver este pedido", 403);
  }

  res.json({ order });
}

export async function checkout(req, res) {
  const { recipientName, recipientPhone, recipientAddress, notes } = req.body;

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
  const order = await prisma.order.create({
    data: {
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
    },
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
    throw new AppError("El pedido no está pendiente de pago", 400);
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: "CONFIRMED" },
    include: { items: true },
  });

  await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });

  await createNotification({
    userId: order.userId,
    type: "ORDER_CONFIRMED",
    title: "Pago confirmado",
    message: `Tu pedido #${id.slice(0, 8)} está confirmado y listo para reparto.`,
  });

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

  const statusLabels = {
    CONFIRMED: "confirmado",
    CANCELLED: "cancelado",
  };

  if (status === "CONFIRMED" || status === "CANCELLED") {
    await createNotification({
      userId: order.userId,
      type: `ORDER_${status}`,
      title: "Pedido actualizado",
      message: `Tu pedido #${order.id.slice(0, 8)} está ${statusLabels[status] || status}.`,
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
    title: "Pedido cancelado",
    message: `Tu pedido #${order.id.slice(0, 8)} ha sido cancelado.`,
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
      include: { items: true, user: { select: { id: true, name: true, email: true } }, delivery: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ data, total, page: Number(page), limit: Number(limit) });
}
