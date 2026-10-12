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
 * @param {object} opts
 * @param {string} opts.scope
 * @param {string} opts.key
 * @param {string} opts.actorId
 * @param {string} [opts.orderId]
 * @param {() => Promise<object>} opts.run - debe devolver payload JSON-serializable
 */
export async function withIdempotency({ scope, key, actorId, orderId, run }) {
  if (!key) {
    return run();
  }

  const existing = await prisma.requestIdempotency.findUnique({
    where: { scope_key: { scope, key } },
  });
  if (existing) {
    if (existing.actorId !== actorId) {
      throw codedError("IDEMPOTENCY_KEY_CONFLICT", 409);
    }
    return existing.responseBody;
  }

  const responseBody = await run();

  try {
    await prisma.requestIdempotency.create({
      data: {
        scope,
        key,
        actorId,
        orderId: orderId ?? null,
        responseBody,
      },
    });
  } catch (err) {
    if (err.code === "P2002") {
      const raced = await prisma.requestIdempotency.findUnique({
        where: { scope_key: { scope, key } },
      });
      if (raced?.actorId === actorId) return raced.responseBody;
      throw codedError("IDEMPOTENCY_KEY_CONFLICT", 409);
    }
    throw err;
  }

  return responseBody;
}
