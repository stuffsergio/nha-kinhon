/** Estados pagados y listos para que un repartidor los recoja (self-assign). */
export const AVAILABLE_ORDER_STATUSES = ["CONFIRMED", "PROCESSING", "SHIPPED"];

/** Alias de estados internos → nombres esperados por la app móvil. */
const STATUS_MOBILE_ALIASES = {
  PROCESSING: "PREPARING",
  SHIPPED: "READY",
};

export function isPickupEligible(status) {
  return AVAILABLE_ORDER_STATUSES.includes(status);
}

export function toMobileStatus(status) {
  return STATUS_MOBILE_ALIASES[status] || status;
}

export function formatDeliveryOrder(order, { includeItems = true } = {}) {
  const formatted = {
    id: order.id,
    status: toMobileStatus(order.status),
    total: order.total,
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone ?? null,
    recipientAddress: order.recipientAddress ?? null,
    contactName: order.recipientName,
    contactPhone: order.recipientPhone ?? null,
    deliveryAddress: order.recipientAddress ?? null,
    createdAt: order.createdAt,
  };

  if (includeItems && order.items) {
    formatted.items = order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));
  }

  return formatted;
}

export function buildAvailableOrdersWhere({ serviceAreaFilter } = {}) {
  const where = {
    status: { in: AVAILABLE_ORDER_STATUSES },
    deliveryId: null,
  };

  if (serviceAreaFilter) {
    where.recipientAddress = {
      contains: serviceAreaFilter,
      mode: "insensitive",
    };
  }

  return where;
}
