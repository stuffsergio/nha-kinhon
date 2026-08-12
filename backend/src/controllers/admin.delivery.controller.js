import prisma from "../config/db.js";
import { AppError, NotFoundError } from "../utils/errors.js";
import { createNotification } from "../services/notification.service.js";
import {
  ACTIVE_DELIVERY_STATUSES,
  MAX_ACTIVE_DELIVERY_ORDERS,
} from "../utils/deliveryCapacity.js";

export async function listDeliveryPeople(req, res) {
  const profiles = await prisma.deliveryProfile.findMany({
    include: {
      user: {
        select: {
          id: true, name: true, email: true,
          _count: { select: { deliveryOrders: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = profiles.map((p) => ({
    ...p,
    deliveryCount: p.user._count.deliveryOrders,
    user: { id: p.user.id, name: p.user.name, email: p.user.email },
  }));

  res.json({ data });
}

export async function assignDelivery(req, res) {
  const { id } = req.params;
  const { deliveryId } = req.body;

  if (!deliveryId) throw new AppError("Se requiere deliveryId", 400);

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new NotFoundError("Pedido");
  if (!["CONFIRMED", "PROCESSING", "SHIPPED"].includes(order.status)) {
    throw new AppError("El pedido no está disponible para asignar", 400);
  }
  if (order.deliveryId) {
    throw new AppError("El pedido ya tiene un repartidor asignado", 400);
  }

  const delivery = await prisma.user.findUnique({
    where: { id: deliveryId },
    include: { deliveryProfile: true },
  });
  if (!delivery || delivery.role !== "DELIVERY") {
    throw new AppError("El usuario no es un repartidor", 400);
  }

  const activeCount = await prisma.order.count({
    where: {
      deliveryId,
      status: { in: ACTIVE_DELIVERY_STATUSES },
    },
  });
  if (activeCount >= MAX_ACTIVE_DELIVERY_ORDERS) {
    throw new AppError(
      `Este repartidor ya tiene ${MAX_ACTIVE_DELIVERY_ORDERS} pedidos activos`,
      409,
    );
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      deliveryId,
      status: "PICKED_UP",
      pickedUpAt: new Date(),
    },
    include: { items: true },
  });

  await prisma.deliveryProfile.update({
    where: { userId: deliveryId },
    data: { totalDeliveries: { increment: 1 } },
  });

  await createNotification({
    userId: order.userId,
    type: "ORDER_PICKED_UP",
    title: "Pedido recogido",
    message: `Tu pedido #${id.slice(0, 8)} ha sido recogido por un repartidor.`,
    orderId: order.id,
  });

  res.json({ order: updated });
}
