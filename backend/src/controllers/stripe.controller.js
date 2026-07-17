import Stripe from "stripe";
import prisma from "../config/db.js";
import env from "../config/env.js";
import { AppError, NotFoundError, ForbiddenError } from "../utils/errors.js";
import { isUnpaidOrderStatus } from "../utils/orderPayment.js";

let stripeClient = null;

function getStripe() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError("Stripe no está configurado", 503);
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

async function markOrderPaid({ orderId, userId, stripePaymentId }) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || !isUnpaidOrderStatus(order.status)) {
    return null;
  }

  const data = { status: "CONFIRMED" };
  if (stripePaymentId) data.stripePaymentId = stripePaymentId;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data,
  });

  const ownerId = userId || order.userId;
  await prisma.cartItem.deleteMany({ where: { userId: ownerId } });

  await prisma.notification.create({
    data: {
      userId: order.userId,
      type: "ORDER_CONFIRMED",
      title: "Pago recibido",
      message: `El pago del pedido #${orderId.slice(0, 8)} se ha confirmado.`,
    },
  });

  return updated;
}

async function markOrderCancelled(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || !isUnpaidOrderStatus(order.status)) {
    return null;
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });
}

export async function getConfig(req, res) {
  res.json({ publishableKey: env.STRIPE_PUBLISHABLE_KEY });
}

/**
 * Payment Sheet (móvil): requiere orderId de un borrador PENDING_PAYMENT.
 * Asocia el PaymentIntent al pedido; la confirmación real llega por webhook.
 */
export async function createPaymentSheet(req, res) {
  const { orderId } = req.body;

  if (!orderId) {
    throw new AppError("Se requiere orderId", 400);
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Pedido");
  if (order.userId !== req.user.id) throw new ForbiddenError("No tienes permiso");
  if (!isUnpaidOrderStatus(order.status)) {
    throw new AppError("El pedido no está pendiente de pago", 400);
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new NotFoundError("Usuario");

  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await getStripe().customers.create({
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const paymentIntent = await getStripe().paymentIntents.create({
    amount: Math.round(order.total),
    currency: "xof",
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    metadata: { orderId: order.id, userId: user.id },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentId: paymentIntent.id },
  });

  const ephemeralKey = await getStripe().ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: "2025-02-24.acacia" },
  );

  res.json({
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customerId,
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    orderId: order.id,
  });
}

export async function createCheckoutSession(req, res) {
  const { orderId } = req.body;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Pedido");
  if (order.userId !== req.user.id) throw new ForbiddenError("No tienes permiso");
  if (!isUnpaidOrderStatus(order.status)) {
    throw new AppError("El pedido no está pendiente de pago", 400);
  }

  const session = await getStripe().checkout.sessions.create({
    ui_mode: "elements",
    mode: "payment",
    return_url: `${env.CLIENT_URL}/perfil?payment=success`,
    line_items: [
      {
        price_data: {
          currency: "xof",
          product_data: { name: `Pedido #${order.id.slice(0, 8)}` },
          unit_amount: Math.round(order.total),
        },
        quantity: 1,
      },
    ],
    metadata: { orderId: order.id, userId: req.user.id },
    payment_intent_data: {
      metadata: { orderId: order.id, userId: req.user.id },
    },
  });

  // Preferir PaymentIntent id si ya viene en la sesión; si no, guardar session.id
  const stripePaymentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || session.id;

  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentId },
  });

  res.json({ clientSecret: session.client_secret, status: session.status, publishableKey: env.STRIPE_PUBLISHABLE_KEY });
}

export async function handleWebhook(req, res) {
  let event;

  if (env.STRIPE_WEBHOOK_SECRET) {
    const sig = req.headers["stripe-signature"];
    try {
      event = getStripe().webhooks.constructEvent(req.rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
    } catch {
      return res.status(400).json({ error: "Firma de webhook inválida" });
    }
  } else {
    event = req.body;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    const userId = session.metadata?.userId;
    const stripePaymentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || session.id;

    if (orderId) {
      await markOrderPaid({ orderId, userId, stripePaymentId });
    }
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    let orderId = paymentIntent.metadata?.orderId;
    const userId = paymentIntent.metadata?.userId;

    if (!orderId) {
      const byPi = await prisma.order.findFirst({
        where: { stripePaymentId: paymentIntent.id },
      });
      orderId = byPi?.id;
    }

    if (orderId) {
      await markOrderPaid({
        orderId,
        userId,
        stripePaymentId: paymentIntent.id,
      });
    }
  }

  if (
    event.type === "checkout.session.async_payment_failed" ||
    event.type === "payment_intent.payment_failed" ||
    event.type === "payment_intent.canceled"
  ) {
    const obj = event.data.object;
    let orderId = obj.metadata?.orderId;

    if (!orderId && obj.id) {
      const byPi = await prisma.order.findFirst({
        where: { stripePaymentId: obj.id },
      });
      orderId = byPi?.id;
    }

    if (orderId) {
      await markOrderCancelled(orderId);
    }
  }

  res.json({ received: true });
}
