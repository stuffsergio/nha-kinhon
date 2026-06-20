import env from "../config/env.js";

export async function createPaymentIntent(req, res) {
  const { orderId } = req.body;

  res.json({
    message: "Stripe no está configurado aún. Vuelve más tarde.",
    clientSecret: null,
  });
}

export async function handleWebhook(req, res) {
  res.status(200).json({ received: true });
}
