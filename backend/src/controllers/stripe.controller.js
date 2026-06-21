import Stripe from "stripe";
import prisma from "../config/db.js";
import env from "../config/env.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function createPaymentIntent(req, res) {
  const { orderId } = req.body;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Pedido");
  if (order.userId !== req.user.id) throw new ForbiddenError("No tienes permiso");

  if (order.stripePaymentId) {
    const existing = await stripe.paymentIntents.retrieve(order.stripePaymentId);
    if (existing.status === "succeeded" || existing.status === "processing") {
      return res.json({ clientSecret: existing.client_secret, status: existing.status });
    }
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.total * 100),
    currency: "xof",
    metadata: { orderId: order.id, userId: req.user.id },
    automatic_payment_methods: { enabled: true },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentId: paymentIntent.id },
  });

  res.json({ clientSecret: paymentIntent.client_secret, status: paymentIntent.status });
}

export async function handleWebhook(req, res) {
  let event;

  if (env.STRIPE_WEBHOOK_SECRET) {
    const sig = req.headers["stripe-signature"];
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
    } catch {
      return res.status(400).json({ error: "Firma de webhook inválida" });
    }
  } else {
    event = req.body;
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata?.orderId;

    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
      });

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (order) {
        await prisma.notification.create({
          data: {
            userId: order.userId,
            type: "ORDER_CONFIRMED",
            title: "Pago recibido",
            message: `El pago del pedido #${orderId.slice(0, 8)} se ha confirmado.`,
          },
        });
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata?.orderId;

    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
    }
  }

  res.json({ received: true });
}
