import {
  REFUND_CLAIM_DAYS_AFTER_DELIVERY,
} from "../config/refundsDelivery.js";

const PAID_STATUSES = new Set([
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERY_FAILED_ATTEMPT",
  "UNDELIVERABLE",
  "DELIVERED",
  "PARTIALLY_REFUNDED",
]);

export function orderAmountFcfa(order) {
  return Math.round(order.total);
}

export function sumSucceededRefunds(refunds) {
  return (refunds || [])
    .filter((r) => r.status === "SUCCEEDED")
    .reduce((sum, r) => sum + r.amount, 0);
}

export function sumPendingRefunds(refunds) {
  return (refunds || [])
    .filter((r) => r.status === "PENDING")
    .reduce((sum, r) => sum + r.amount, 0);
}

export function refundableRemainingFcfa(order, refunds) {
  const paid = orderAmountFcfa(order);
  const succeeded = sumSucceededRefunds(refunds);
  const pending = sumPendingRefunds(refunds);
  return Math.max(0, paid - succeeded - pending);
}

export function isPreDispatchForCancel(order) {
  if (!PAID_STATUSES.has(order.status)) return false;
  if (order.pickedUpAt) return false;
  if (["PICKED_UP", "IN_TRANSIT", "DELIVERY_FAILED_ATTEMPT", "UNDELIVERABLE", "DELIVERED"].includes(order.status)) {
    return false;
  }
  return ["CONFIRMED", "PROCESSING", "SHIPPED"].includes(order.status) && !order.deliveryId;
}

export function isRefundClaimWindowOpen(order) {
  if (order.status !== "DELIVERED" || !order.deliveredAt) return false;
  const deadline = new Date(order.deliveredAt);
  deadline.setDate(deadline.getDate() + REFUND_CLAIM_DAYS_AFTER_DELIVERY);
  return new Date() <= deadline;
}

/**
 * @param {object} order
 * @param {object[]} refunds
 * @param {object} opts - { reason, orderItemIds, items }
 */
export function assertRefundEligibility(order, refunds, { reason, orderItemIds, items }) {
  const remaining = refundableRemainingFcfa(order, refunds);
  if (remaining <= 0) {
    return { ok: false, code: "REFUND_NOTHING_LEFT" };
  }

  if (reason === "CANCEL_BEFORE_DISPATCH") {
    if (!isPreDispatchForCancel(order)) {
      return { ok: false, code: "REFUND_CANCEL_NOT_ELIGIBLE" };
    }
    return { ok: true, maxAmount: remaining, suggestedAmount: remaining };
  }

  if (reason === "UNDELIVERABLE") {
    if (order.status !== "UNDELIVERABLE" && order.status !== "DELIVERY_FAILED_ATTEMPT") {
      return { ok: false, code: "REFUND_UNDELIVERABLE_NOT_ELIGIBLE" };
    }
    return { ok: true, maxAmount: remaining, suggestedAmount: remaining };
  }

  if (reason === "DAMAGED_PRODUCT" || reason === "MISSING_PRODUCT") {
    if (!isRefundClaimWindowOpen(order)) {
      return { ok: false, code: "REFUND_CLAIM_WINDOW_CLOSED" };
    }
    if (orderItemIds?.length && items?.length) {
      const lineTotal = items
        .filter((it) => orderItemIds.includes(it.id))
        .reduce((s, it) => s + Math.round(it.price * it.quantity), 0);
      const capped = Math.min(lineTotal, remaining);
      return { ok: true, maxAmount: remaining, suggestedAmount: capped || remaining };
    }
    return { ok: true, maxAmount: remaining, suggestedAmount: remaining };
  }

  if (reason === "ADMIN_MANUAL" || reason === "OTHER") {
    return { ok: true, maxAmount: remaining, suggestedAmount: remaining };
  }

  return { ok: false, code: "REFUND_REASON_INVALID" };
}

export function computeOrderRefundStatus(orderTotalFcfa, succeededTotal) {
  if (succeededTotal <= 0) return null;
  if (succeededTotal >= orderTotalFcfa) return "REFUNDED";
  return "PARTIALLY_REFUNDED";
}
