export async function createPaymentIntent(amount, currency = "xof") {
  console.log(`[PAYMENT] Creando PaymentIntent: ${amount} ${currency}`);
  console.log(`[PAYMENT] Integrar con Stripe cuando esté configurado`);
  return null;
}

export async function confirmPayment(paymentIntentId) {
  console.log(`[PAYMENT] Confirmando PaymentIntent: ${paymentIntentId}`);
}

export async function refundPayment(paymentIntentId) {
  console.log(`[PAYMENT] Reembolsando PaymentIntent: ${paymentIntentId}`);
}
