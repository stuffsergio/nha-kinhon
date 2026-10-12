import prisma from "../config/db.js";

export async function recordOrderEvent({
  orderId,
  type,
  actorId,
  actorRole,
  payload,
}) {
  return prisma.orderEvent.create({
    data: {
      orderId,
      type,
      actorId: actorId ?? null,
      actorRole: actorRole ?? null,
      payload: payload ?? undefined,
    },
  });
}
