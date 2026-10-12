import { codedError } from "./errors.js";
import {
  orderAmountFcfa,
  refundableRemainingFcfa,
  sumPendingRefunds,
  sumSucceededRefunds,
} from "./orderRefunds.js";

/** Bloqueo de fila del pedido para serializar reservas de reembolso. */
export async function lockOrderRow(tx, orderId) {
  await tx.$executeRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
}

export async function loadOrderWithRefundsTx(tx, orderId) {
  return tx.order.findUnique({
    where: { id: orderId },
    include: { items: true, refunds: true },
  });
}

/** Importe máximo que puede tomar un reembolso concreto (excluye su propio PENDING previo). */
export function maxRefundableForRefund(order, refunds, refundId) {
  const paid = orderAmountFcfa(order);
  const succeeded = sumSucceededRefunds(refunds);
  const otherPending = sumPendingRefunds(refunds.filter((r) => r.id !== refundId));
  return Math.max(0, paid - succeeded - otherPending);
}

export function assertRefundAmountWithinLimit(order, refunds, amountFcfa, { excludeRefundId } = {}) {
  const max =
    excludeRefundId != null
      ? maxRefundableForRefund(order, refunds, excludeRefundId)
      : refundableRemainingFcfa(order, refunds);
  if (amountFcfa <= 0 || amountFcfa > max) {
    throw codedError("REFUND_AMOUNT_INVALID", 400);
  }
  return max;
}
