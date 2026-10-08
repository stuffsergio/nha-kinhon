import prisma from "../config/db.js";
import { AppError, NotFoundError } from "../utils/errors.js";
import { createNotification } from "../services/notification.service.js";
import {
  buildAvailableOrdersWhere,
  formatDeliveryOrder,
  isPickupEligible,
} from "../utils/deliveryOrders.js";
import {
  ACTIVE_DELIVERY_STATUSES,
  MAX_ACTIVE_DELIVERY_ORDERS,
} from "../utils/deliveryCapacity.js";
import { checkAndNotifyCourierNearby } from "../services/deliveryProximity.service.js";
import {
  mergeLocationBatch,
  parseLocationIngestBody,
} from "../utils/deliveryLocationIngest.js";
import {
  assertValidDeliveryPhotoUrl,
  normalizePhotoList,
  MAX_PHOTOS_PER_REQUEST,
  MAX_PHOTOS_PER_ORDER,
} from "../utils/deliveryPhoto.js";

async function countActiveOrdersForDelivery(deliveryUserId) {
  return prisma.order.count({
    where: {
      deliveryId: deliveryUserId,
      status: { in: ACTIVE_DELIVERY_STATUSES },
    },
  });
}

async function assertDeliveryHasCapacity(deliveryUserId) {
  const active = await countActiveOrdersForDelivery(deliveryUserId);
  if (active >= MAX_ACTIVE_DELIVERY_ORDERS) {
    throw new AppError(
      `Solo puedes tener ${MAX_ACTIVE_DELIVERY_ORDERS} pedidos activos. Completa una entrega antes de recoger otro.`,
      409,
    );
  }
}

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

  await assertDeliveryHasCapacity(req.user.id);

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
    title: "Repartidor asignado",
    message: `Un repartidor recogió tu pedido #${id.slice(0, 8)}. Sigue el envío en tiempo real.`,
    orderId: order.id,
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
    if (deliveryPhoto) {
      try {
        updateData.deliveryPhoto = assertValidDeliveryPhotoUrl(deliveryPhoto);
      } catch (e) {
        throw new AppError(e.message, 400);
      }
    }
    const existingPhotos = await prisma.orderDeliveryPhoto.count({ where: { orderId: id } });
    if (!updateData.deliveryPhoto && existingPhotos === 0) {
      throw new AppError("Adjunta al menos una foto de entrega", 400);
    }
  }

  const updated = await prisma.order.update({
    where: { id },
    data: updateData,
    include: { items: true },
  });

  if (status === "IN_TRANSIT") {
    await createNotification({
      userId: order.userId,
      type: "ORDER_IN_TRANSIT",
      title: "Pedido en camino",
      message: `Tu pedido #${id.slice(0, 8)} está en camino hacia ti.`,
      orderId: order.id,
    });
  }

  if (status === "DELIVERED") {
    if (updateData.deliveryPhoto) {
      const duplicate = await prisma.orderDeliveryPhoto.findFirst({
        where: { orderId: id, url: updateData.deliveryPhoto },
      });
      if (!duplicate) {
        await prisma.orderDeliveryPhoto.create({
          data: {
            orderId: id,
            url: updateData.deliveryPhoto,
            uploadedById: req.user.id,
          },
        });
      }
    }
    await createNotification({
      userId: order.userId,
      type: "ORDER_DELIVERED",
      title: "Pedido entregado",
      message: `Tu pedido #${id.slice(0, 8)} ha sido entregado.`,
      orderId: order.id,
    });
  }

  res.json({ order: updated });
}

export async function addDeliveryPhotos(req, res) {
  const { id } = req.params;
  const rawList = normalizePhotoList(req.body);
  if (rawList.length === 0) {
    throw new AppError("Se requiere al menos una foto (photo o photos)", 400);
  }
  if (rawList.length > MAX_PHOTOS_PER_REQUEST) {
    throw new AppError(`Máximo ${MAX_PHOTOS_PER_REQUEST} fotos por solicitud`, 400);
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new NotFoundError("Pedido");
  if (order.deliveryId !== req.user.id) {
    throw new AppError("Este pedido no te pertenece", 403);
  }
  if (!["PICKED_UP", "IN_TRANSIT"].includes(order.status)) {
    throw new AppError("Solo puedes subir fotos mientras el pedido está en reparto", 400);
  }

  const existingCount = await prisma.orderDeliveryPhoto.count({ where: { orderId: id } });
  if (existingCount + rawList.length > MAX_PHOTOS_PER_ORDER) {
    throw new AppError(`Máximo ${MAX_PHOTOS_PER_ORDER} fotos por pedido`, 400);
  }

  const urls = [];
  for (const raw of rawList) {
    try {
      urls.push(assertValidDeliveryPhotoUrl(raw));
    } catch (e) {
      throw new AppError(e.message, 400);
    }
  }

  const created = await Promise.all(
    urls.map((url) =>
      prisma.orderDeliveryPhoto.create({
        data: {
          orderId: id,
          url,
          uploadedById: req.user.id,
        },
      }),
    ),
  );

  res.status(201).json({ photos: created });
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
  const points = parseLocationIngestBody(req.body);

  const profile = await prisma.deliveryProfile.findUnique({
    where: { userId: req.user.id },
  });
  if (!profile) throw new NotFoundError("Perfil de repartidor");

  const mergeResult = mergeLocationBatch(profile.currentLocation, points);
  const { location: currentLocation, changed, appliedCount, skippedOlder } = mergeResult;

  if (changed) {
    await prisma.deliveryProfile.update({
      where: { userId: req.user.id },
      data: { currentLocation },
    });

    await checkAndNotifyCourierNearby(req.user.id, currentLocation.lat, currentLocation.lng);
  }

  res.json({
    message: changed ? "Ubicación actualizada" : "Ubicación sin cambios (datos antiguos o duplicados)",
    location: currentLocation,
    applied: appliedCount,
    skippedOlder,
  });
}
