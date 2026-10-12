import { MAX_DELIVERY_ATTEMPTS } from "../config/refundsDelivery.js";

/** Motivos que pasan directamente a UNDELIVERABLE (sin reintento). */
export const NON_RETRYABLE_FAILURE_REASONS = new Set([
  "RECIPIENT_REFUSED",
  "PRODUCT_DAMAGED",
]);

export const DELIVERY_FAILURE_REASONS = [
  "RECIPIENT_ABSENT",
  "WRONG_ADDRESS",
  "RECIPIENT_REFUSED",
  "UNREACHABLE_PHONE",
  "ACCESS_BLOCKED",
  "PRODUCT_DAMAGED",
  "OTHER",
];

export function canRecordDeliveryFailure(orderStatus) {
  return orderStatus === "IN_TRANSIT" || orderStatus === "PICKED_UP";
}

export function resolveStatusAfterFailure({ reason, failedAttemptsAfter }) {
  if (NON_RETRYABLE_FAILURE_REASONS.has(reason)) {
    return "UNDELIVERABLE";
  }
  if (failedAttemptsAfter >= MAX_DELIVERY_ATTEMPTS) {
    return "UNDELIVERABLE";
  }
  return "DELIVERY_FAILED_ATTEMPT";
}

export function canRescheduleDelivery(status) {
  return status === "DELIVERY_FAILED_ATTEMPT";
}
