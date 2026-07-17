/** Estados de borrador: pedido creado pero aún no pagado / no válido para admin-delivery. */
export const UNPAID_ORDER_STATUSES = ["PENDING_PAYMENT", "PENDING"];

/** Excluidos de listados por defecto (usuario, admin). */
export const DEFAULT_HIDDEN_ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PENDING",
  "CANCELLED",
];

export function isUnpaidOrderStatus(status) {
  return UNPAID_ORDER_STATUSES.includes(status);
}

/**
 * Filtro de listado: si no se pide un status concreto, oculta borradores y cancelados.
 * Si se filtra por status, se respeta (p. ej. status=CANCELLED o PENDING_PAYMENT).
 */
export function applyDefaultOrderListFilter(where, statusQuery) {
  if (statusQuery) {
    where.status = statusQuery;
    return where;
  }
  where.status = { notIn: DEFAULT_HIDDEN_ORDER_STATUSES };
  return where;
}
