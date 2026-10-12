import prisma from "../config/db.js";

export async function logAdminAction({ adminId, action, orderId, refundId, metadata }) {
  return prisma.adminAuditLog.create({
    data: {
      adminId,
      action,
      orderId: orderId ?? null,
      refundId: refundId ?? null,
      metadata: metadata ?? undefined,
    },
  });
}
