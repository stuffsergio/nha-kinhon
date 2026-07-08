import Stripe from "stripe";
import prisma from "../config/db.js";
import env from "../config/env.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function createPaymentSheet(req, res) {
  const { amount } = req.body;

  const customer = await stripe.customers.create({
    metadata: { userId: req.user.id },
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount),
    currency: "xof",
    customer: customer.id,
    automatic_payment_methods: { enabled: true },
    metadata: { userId: req.user.id },
  });

  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customer.id },
    { apiVersion: "2025-02-24.acacia" },
  );

  res.json({
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customer.id,
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
  });
}

export async function createCheckoutSession(req, res) {
  const { orderId } = req.body;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Pedido");
  if (order.userId !== req.user.id) throw new ForbiddenError("No tienes permiso");

  const session = await stripe.checkout.sessions.create({
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

  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentId: session.id },
  });

  res.json({ clientSecret: session.client_secret, status: session.status, publishableKey: env.STRIPE_PUBLISHABLE_KEY });
}

export async function handleWebhook(req, res) {
  let event;

  if (env.STRIPE_WEBHOOK_SECRET) {
    const sig = req.headers["stripe-signature"];
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
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

    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
      });

      if (userId) {
        await prisma.cartItem.deleteMany({ where: { userId } });
      }

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

  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
    }
  }

  res.json({ received: true });
}
