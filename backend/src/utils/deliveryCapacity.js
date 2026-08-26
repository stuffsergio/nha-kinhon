/** Máximo de pedidos activos (no entregados/cancelados) por repartidor. */
export const MAX_ACTIVE_DELIVERY_ORDERS = 2;

/** Estados que cuentan como “en curso” para el cupo del repartidor. */
export const ACTIVE_DELIVERY_STATUSES = ["PICKED_UP", "IN_TRANSIT"];

export function isActiveDeliveryStatus(status) {
  return ACTIVE_DELIVERY_STATUSES.includes(status);
}
