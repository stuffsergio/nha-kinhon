/**
 * Evita mezclar claves Stripe live/test con el entorno de despliegue.
 * APP_ENV: production | staging | development (por defecto: production si NODE_ENV=production, si no development).
 */
export function resolveAppEnv() {
  const explicit = process.env.APP_ENV?.trim().toLowerCase();
  if (explicit) return explicit;
  if (process.env.NODE_ENV === "production") return "production";
  return "development";
}

function stripeKeyMode(secretKey) {
  if (!secretKey || typeof secretKey !== "string") return null;
  const trimmed = secretKey.trim();
  if (trimmed.startsWith("sk_test_")) return "test";
  if (trimmed.startsWith("sk_live_")) return "live";
  return "unknown";
}

/**
 * Sale con código 1 si la clave Stripe no coincide con APP_ENV.
 * Sin STRIPE_SECRET_KEY no hace nada (pagos desactivados).
 */
export function assertStripeEnvironmentAlignment() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey?.trim()) return;

  const appEnv = resolveAppEnv();
  const mode = stripeKeyMode(secretKey);

  if (mode === "unknown") {
    console.error(
      "[stripe-env] STRIPE_SECRET_KEY debe empezar por sk_test_ o sk_live_.",
    );
    process.exit(1);
  }

  if (appEnv === "production" && mode === "test") {
    console.error(
      "[stripe-env] Refusing to boot: APP_ENV=production (or NODE_ENV=production) with STRIPE test key (sk_test_). Use sk_live_ in producción o APP_ENV=staging para pruebas.",
    );
    process.exit(1);
  }

  if (appEnv === "staging" && mode === "live") {
    console.error(
      "[stripe-env] Refusing to boot: APP_ENV=staging with STRIPE live key (sk_live_). Use sk_test_ en staging.",
    );
    process.exit(1);
  }
}

export function describeStripeEnvironmentForHealth() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return {
    appEnv: resolveAppEnv(),
    stripeConfigured: Boolean(key),
    stripeMode: key ? stripeKeyMode(key) : null,
  };
}
