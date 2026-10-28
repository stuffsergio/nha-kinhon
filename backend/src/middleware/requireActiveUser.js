import prisma from "../config/db.js";
import { codedError } from "../utils/errors.js";

export async function requireActiveUser(req, res, next) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { deletedAt: true, isBlocked: true },
  });
  if (!user) throw codedError("NOT_FOUND", 404);
  if (user.deletedAt) throw codedError("ACCOUNT_DELETED", 403);
  if (user.isBlocked) throw codedError("ACCOUNT_BLOCKED", 403);
  next();
}
