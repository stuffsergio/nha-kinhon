import prisma from "../config/db.js";
import { codedError } from "./errors.js";
import { parseIdempotencyKey } from "./requestIdempotency.js";

export { parseIdempotencyKey };

export function requireIdempotencyKey(headerValue) {
  const key = parseIdempotencyKey(headerValue);
  if (!key) {
    throw codedError("IDEMPOTENCY_KEY_REQUIRED", 400);
  }
  return key;
}

export async function withWalletIdempotency({ scope, key, actorId, run }) {
  const existing = await prisma.walletRequestIdempotency.findUnique({
    where: { scope_actorId_key: { scope, actorId, key } },
  });
  if (existing) {
    return { replay: true, body: existing.responseBody };
  }

  const result = await run();
  const responseBody = JSON.parse(JSON.stringify(result));

  try {
    await prisma.walletRequestIdempotency.create({
      data: { scope, key, actorId, responseBody },
    });
  } catch (err) {
    if (err.code === "P2002") {
      const raced = await prisma.walletRequestIdempotency.findUnique({
        where: { scope_actorId_key: { scope, actorId, key } },
      });
      if (raced) return { replay: true, body: raced.responseBody };
    }
    throw err;
  }

  return { replay: false, body: responseBody };
}
