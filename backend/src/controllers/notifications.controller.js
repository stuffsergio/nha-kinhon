import prisma from "../config/db.js";

export async function list(req, res) {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  const where = { userId: req.user.id };
  if (unreadOnly === "true") where.read = false;

  const [data, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip: (page - 1) * limit,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where: { userId: req.user.id } }),
    prisma.notification.count({
      where: { userId: req.user.id, read: false },
    }),
  ]);

  res.json({ data, total, unreadCount, page: Number(page), limit: Number(limit) });
}

export async function markAsRead(req, res) {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data: { read: true },
  });

  res.json({ message: "Notificación marcada como leída" });
}

export async function markAllAsRead(req, res) {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true },
  });

  res.json({ message: "Todas las notificaciones marcadas como leídas" });
}

export async function unreadCount(req, res) {
  const count = await prisma.notification.count({
    where: { userId: req.user.id, read: false },
  });

  res.json({ count });
}
