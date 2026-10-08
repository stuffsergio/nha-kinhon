import env from "./env.js";

export const isProduction = process.env.NODE_ENV === "production";

/** Dev-only: confirm orders without Stripe (local smoke tests). Never enable in production. */
export function allowUnverifiedPaymentConfirm() {
  if (isProduction) return false;
  if (env.STRIPE_SECRET_KEY) return false;
  return process.env.ALLOW_UNVERIFIED_PAYMENT_CONFIRM === "true";
}

export function getAllowedClientOrigins() {
  return (env.CLIENT_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isOriginAllowed(origin) {
  if (!origin) return false;
  const allowed = getAllowedClientOrigins();
  if (allowed.includes(origin)) return true;
  if (origin.startsWith("exp://") || origin.startsWith("nhakinhon://")) return true;
  return false;
}
