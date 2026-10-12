export const MAX_DELIVERY_ATTEMPTS =
  parseInt(process.env.MAX_DELIVERY_ATTEMPTS, 10) || 2;

/** Horas para que el comprador corrija datos o elija reintento/reembolso tras un fallo. */
export const BUYER_RESOLUTION_WINDOW_HOURS =
  parseInt(process.env.BUYER_RESOLUTION_WINDOW_HOURS, 10) || 72;

/** Días tras entrega para reclamar producto dañado o faltante. */
export const REFUND_CLAIM_DAYS_AFTER_DELIVERY =
  parseInt(process.env.REFUND_CLAIM_DAYS_AFTER_DELIVERY, 10) || 7;

export const isStripeLiveConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);
