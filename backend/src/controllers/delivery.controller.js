import prisma from "../config/db.js";
import { AppError, NotFoundError } from "../utils/errors.js";
import { createNotification } from "../services/notification.service.js";
import {
  buildAvailableOrdersWhere,
  formatDeliveryOrder,
  isPickupEligible,
} from "../utils/deliveryOrders.js";

export async function listAvailable(req, res) {
  const { serviceArea } = req.query;

  let serviceAreaFilter;
  if (serviceArea) {
    const profile = await prisma.deliveryProfile.findUnique({ where: { userId: req.user.id } });
    if (profile?.serviceArea) {
      serviceAreaFilter = profile.serviceArea;
    }
  }

  const orders = await prisma.order.findMany({
    where: buildAvailableOrdersWhere({ serviceAreaFilter }),
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  res.json({ data: orders.map((order) => formatDeliveryOrder(order)) });
}

export async function listMyOrders(req, res) {
  const orders = await prisma.order.findMany({
    where: { deliveryId: req.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  res.json({ data: orders.map((order) => formatDeliveryOrder(order)) });
}

export async function pickupOrder(req, res) {
  const { id } = req.params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new NotFoundError("Pedido");
  if (!isPickupEligible(order.status)) {
    throw new AppError("El pedido no está disponible para recoger", 400);
  }
  if (order.deliveryId) throw new AppError("El pedido ya tiene un repartidor asignado", 400);

  const updated = await prisma.order.update({
    where: { id },
    data: {
      deliveryId: req.user.id,
      status: "PICKED_UP",
      pickedUpAt: new Date(),
    },
    include: { items: true },
  });

  await prisma.deliveryProfile.update({
    where: { userId: req.user.id },
    data: { totalDeliveries: { increment: 1 } },
  });

  await createNotification({
    userId: order.userId,
    type: "ORDER_PICKED_UP",
    title: "Pedido recogido",
    message: `Tu pedido #${id.slice(0, 8)} ha sido recogido por un repartidor.`,
  });

  res.json({ order: formatDeliveryOrder(updated) });
}

export async function updateDeliveryStatus(req, res) {
  const { id } = req.params;
  const { status, deliveryPhoto } = req.body;

  const validTransitions = {
    PICKED_UP: ["IN_TRANSIT"],
    IN_TRANSIT: ["DELIVERED"],
  };

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new NotFoundError("Pedido");
  if (order.deliveryId !== req.user.id) throw new AppError("Este pedido no te pertenece", 403);

  if (!validTransitions[order.status]?.includes(status)) {
    throw new AppError(`No se puede cambiar de ${order.status} a ${status}`, 400);
  }

  const updateData = { status };
  if (status === "DELIVERED") {
    updateData.deliveredAt = new Date();
    if (deliveryPhoto) updateData.deliveryPhoto = deliveryPhoto;
  }

  const updated = await prisma.order.update({
    where: { id },
    data: updateData,
    include: { items: true },
  });

  if (status === "DELIVERED") {
    await createNotification({
      userId: order.userId,
      type: "ORDER_DELIVERED",
      title: "Pedido entregado",
      message: `Tu pedido #${id.slice(0, 8)} ha sido entregado.`,
    });
  }

  res.json({ order: updated });
}

export async function getProfile(req, res) {
  const profile = await prisma.deliveryProfile.findUnique({
    where: { userId: req.user.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!profile) throw new NotFoundError("Perfil de repartidor");

  res.json({ profile });
}

export async function updateProfile(req, res) {
  const { phone, vehicle, serviceArea } = req.body;

  const data = {};
  if (phone !== undefined) data.phone = phone;
  if (vehicle !== undefined) data.vehicle = vehicle;
  if (serviceArea !== undefined) data.serviceArea = serviceArea;

  const profile = await prisma.deliveryProfile.update({
    where: { userId: req.user.id },
    data,
  });

  res.json({ profile });
}

export async function toggleActive(req, res) {
  const profile = await prisma.deliveryProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) throw new NotFoundError("Perfil de repartidor");

  const updated = await prisma.deliveryProfile.update({
    where: { userId: req.user.id },
    data: { isActive: !profile.isActive },
  });

  res.json({ profile: updated });
}

export async function getStats(req, res) {
  const profile = await prisma.deliveryProfile.findUnique({
    where: { userId: req.user.id },
    select: { totalDeliveries: true, rating: true, isActive: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [deliveriesToday, deliveriesThisWeek, earningsData, weekEarningsData] = await Promise.all([
    prisma.order.count({
      where: { deliveryId: req.user.id, deliveredAt: { gte: today }, status: "DELIVERED" },
    }),
    prisma.order.count({
      where: { deliveryId: req.user.id, deliveredAt: { gte: weekAgo }, status: "DELIVERED" },
    }),
    prisma.order.aggregate({
      where: { deliveryId: req.user.id, status: "DELIVERED" },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { deliveryId: req.user.id, deliveredAt: { gte: weekAgo }, status: "DELIVERED" },
      _sum: { total: true },
    }),
  ]);

  res.json({
    stats: {
      totalDeliveries: profile?.totalDeliveries || 0,
      rating: profile?.rating || 5.0,
      isActive: profile?.isActive || false,
      deliveriesToday,
      deliveriesThisWeek,
      totalEarnings: earningsData._sum.total || 0,
      earningsThisWeek: weekEarningsData._sum.total || 0,
    },
  });
}

export async function updateLocation(req, res) {
  const { lat, lng } = req.body;

  await prisma.deliveryProfile.update({
    where: { userId: req.user.id },
    data: { currentLocation: { lat, lng } },
  });

  res.json({ message: "Ubicación actualizada" });
}
