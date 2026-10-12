import prisma from "../config/db.js";
import { codedError } from "./errors.js";

export const DELIVERY_FAILED_ATTEMPT_SCOPE = "delivery_failed_attempt";

/** UUID (v4-style) enviado por la app móvil en cola offline. */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseDeliveryFailedIdempotencyKey(headerValue) {
  if (headerValue == null || String(headerValue).trim() === "") {
    throw codedError("IDEMPOTENCY_KEY_REQUIRED", 400);
  }
  const key = String(headerValue).trim().toLowerCase();
  if (!UUID_PATTERN.test(key)) {
    throw codedError("IDEMPOTENCY_KEY_INVALID", 400);
  }
  return key;
}

/** Serializa fechas y objetos Prisma para almacenar/reproducir JSON estable. */
export function normalizeIdempotentPayload(payload) {
  return JSON.parse(JSON.stringify(payload));
}

/**
 * Idempotencia real: clave única por repartidor + pedido + UUID.
 * Reintento de red → misma respuesta sin nuevo intento de entrega.
 */
export async function withDeliveryFailedAttemptIdempotency({
  key,
  courierId,
  orderId,
  run,
}) {
  const existing = await prisma.requestIdempotency.findUnique({
    where: {
      scope_actorId_orderId_key: {
        scope: DELIVERY_FAILED_ATTEMPT_SCOPE,
        actorId: courierId,
        orderId,
        key,
      },
    },
  });

  if (existing) {
    return { responseBody: existing.responseBody, replayed: true };
  }

  const responseBody = normalizeIdempotentPayload(await run());

  try {
    await prisma.requestIdempotency.create({
      data: {
        scope: DELIVERY_FAILED_ATTEMPT_SCOPE,
        key,
        actorId: courierId,
        orderId,
        responseBody,
      },
    });
  } catch (err) {
    if (err.code === "P2002") {
      const raced = await prisma.requestIdempotency.findUnique({
        where: {
          scope_actorId_orderId_key: {
            scope: DELIVERY_FAILED_ATTEMPT_SCOPE,
            actorId: courierId,
            orderId,
            key,
          },
        },
      });
      if (raced) {
        return { responseBody: raced.responseBody, replayed: true };
      }
    }
    throw err;
  }

  return { responseBody, replayed: false };
}
