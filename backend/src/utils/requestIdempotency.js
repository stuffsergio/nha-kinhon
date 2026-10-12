import prisma from "../config/db.js";
import { codedError } from "./errors.js";

const KEY_MAX_LEN = 128;
const KEY_PATTERN = /^[A-Za-z0-9._-]{8,128}$/;

export function parseIdempotencyKey(headerValue) {
  if (headerValue == null || headerValue === "") return null;
  const key = String(headerValue).trim();
  if (key.length > KEY_MAX_LEN || !KEY_PATTERN.test(key)) {
    throw codedError("IDEMPOTENCY_KEY_INVALID", 400);
  }
  return key;
}

/**
 * Idempotencia genérica (requiere orderId para clave compuesta en DB).
 */
export async function withIdempotency({ scope, key, actorId, orderId, run }) {
  if (!key) {
    return run();
  }
  if (!orderId) {
    throw codedError("VALIDATION", 400);
  }

  const existing = await prisma.requestIdempotency.findUnique({
    where: {
      scope_actorId_orderId_key: { scope, actorId, orderId, key },
    },
  });
  if (existing) {
    if (existing.actorId !== actorId) {
      throw codedError("IDEMPOTENCY_KEY_CONFLICT", 409);
    }
    return existing.responseBody;
  }

  const responseBody = JSON.parse(JSON.stringify(await run()));

  try {
    await prisma.requestIdempotency.create({
      data: {
        scope,
        key,
        actorId,
        orderId,
        responseBody,
      },
    });
  } catch (err) {
    if (err.code === "P2002") {
      const raced = await prisma.requestIdempotency.findUnique({
        where: {
          scope_actorId_orderId_key: { scope, actorId, orderId, key },
        },
      });
      if (raced?.actorId === actorId) return raced.responseBody;
      throw codedError("IDEMPOTENCY_KEY_CONFLICT", 409);
    }
    throw err;
  }

  return responseBody;
}
