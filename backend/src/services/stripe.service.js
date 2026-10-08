import Stripe from "stripe";
import env from "../config/env.js";
import { AppError } from "../utils/errors.js";

let stripeClient = null;

export function getStripe() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError("Stripe no está configurado", 503);
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export function isStripeConfigured() {
  return Boolean(env.STRIPE_SECRET_KEY);
}

/**
 * Validates that the order's linked Stripe payment succeeded and matches order amount/metadata.
 * @returns {Promise<{ stripePaymentId: string }>}
 */
export async function assertStripePaymentSucceededForOrder(order) {
  const stripePaymentId = order.stripePaymentId;
  if (!stripePaymentId) {
    throw new AppError(
      "El pago aún no está registrado. Espera unos segundos o contacta con soporte si ya pagaste.",
      402,
    );
  }

  const stripe = getStripe();

  if (stripePaymentId.startsWith("pi_")) {
    const pi = await stripe.paymentIntents.retrieve(stripePaymentId);
    assertPaymentIntentMatchesOrder(pi, order);
    return { stripePaymentId: pi.id };
  }

  if (stripePaymentId.startsWith("cs_")) {
    const session = await stripe.checkout.sessions.retrieve(stripePaymentId, {
      expand: ["payment_intent"],
    });
    if (session.payment_status !== "paid") {
      throw new AppError("El pago no se ha completado en Stripe", 402);
    }
    const pi =
      typeof session.payment_intent === "string"
        ? await stripe.paymentIntents.retrieve(session.payment_intent)
        : session.payment_intent;
    if (pi) {
      assertPaymentIntentMatchesOrder(pi, order);
      return { stripePaymentId: pi.id };
    }
    const amountOk = session.amount_total === Math.round(order.total);
    if (!amountOk) {
      throw new AppError("El importe del pago no coincide con el pedido", 400);
    }
    if (session.metadata?.orderId && session.metadata.orderId !== order.id) {
      throw new AppError("El pago no corresponde a este pedido", 403);
    }
    return { stripePaymentId };
  }

  throw new AppError("Referencia de pago desconocida", 400);
}

export function assertPaymentIntentMatchesOrder(paymentIntent, order) {
  if (paymentIntent.status !== "succeeded") {
    throw new AppError("El pago no se ha completado en Stripe", 402);
  }
  const expectedAmount = Math.round(order.total);
  if (paymentIntent.amount !== expectedAmount) {
    throw new AppError("El importe del pago no coincide con el pedido", 400);
  }
  const metaOrderId = paymentIntent.metadata?.orderId;
  if (metaOrderId && metaOrderId !== order.id) {
    throw new AppError("El pago no corresponde a este pedido", 403);
  }
  const metaUserId = paymentIntent.metadata?.userId;
  if (metaUserId && metaUserId !== order.userId) {
    throw new AppError("El pago no corresponde a este usuario", 403);
  }
}
