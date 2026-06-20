import prisma from "../config/db.js";
import { NotFoundError } from "../utils/errors.js";

export async function list(req, res) {
  const { page = 1, limit = 20, type, location } = req.query;
  const where = { active: true };
  if (type) where.type = type;
  if (location) where.location = { contains: location, mode: "insensitive" };

  const [data, total] = await Promise.all([
    prisma.market.findMany({
      where,
      skip: (page - 1) * limit,
      take: Number(limit),
      include: { _count: { select: { products: true } } },
    }),
    prisma.market.count({ where }),
  ]);

  res.json({ data, total, page: Number(page), limit: Number(limit) });
}

export async function getById(req, res) {
  const market = await prisma.market.findUnique({
    where: { id: req.params.id },
    include: { products: { where: { available: true } } },
  });

  if (!market || !market.active) throw new NotFoundError("Mercado");
  res.json({ market });
}

export async function create(req, res) {
  const market = await prisma.market.create({ data: req.body });
  res.status(201).json({ market });
}

export async function update(req, res) {
  const market = await prisma.market.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json({ market });
}

export async function remove(req, res) {
  await prisma.market.update({
    where: { id: req.params.id },
    data: { active: false },
  });

  res.json({ message: "Mercado desactivado" });
}
