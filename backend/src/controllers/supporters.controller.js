import prisma from "../config/db.js";
import { NotFoundError } from "../utils/errors.js";

export async function list(req, res) {
  const supporters = await prisma.supporter.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
  });

  res.json({ data: supporters });
}

export async function create(req, res) {
  const data = {
    name: req.body.name,
    message: req.body.message,
    avatar: req.body.avatar || null,
    userId: req.user?.id || null,
  };

  const supporter = await prisma.supporter.create({ data });
  res.status(201).json({ supporter });
}

export async function approve(req, res) {
  const supporter = await prisma.supporter.findUnique({
    where: { id: req.params.id },
  });

  if (!supporter) throw new NotFoundError("Testimonio");

  const updated = await prisma.supporter.update({
    where: { id: req.params.id },
    data: { approved: true },
  });

  res.json({ supporter: updated });
}

export async function remove(req, res) {
  const supporter = await prisma.supporter.findUnique({
    where: { id: req.params.id },
  });

  if (!supporter) throw new NotFoundError("Testimonio");

  await prisma.supporter.delete({ where: { id: req.params.id } });
  res.json({ message: "Testimonio eliminado" });
}
