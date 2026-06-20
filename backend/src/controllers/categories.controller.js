import prisma from "../config/db.js";
import { NotFoundError } from "../utils/errors.js";

export async function list(req, res) {
  const categories = await prisma.category.findMany({
    where: { active: true },
    include: { _count: { select: { products: true } } },
  });

  res.json({ data: categories });
}

export async function getById(req, res) {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: { products: { where: { available: true } } },
  });

  if (!category || !category.active) throw new NotFoundError("Categoría");
  res.json({ category });
}

export async function create(req, res) {
  const category = await prisma.category.create({ data: req.body });
  res.status(201).json({ category });
}

export async function update(req, res) {
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json({ category });
}

export async function remove(req, res) {
  await prisma.category.update({
    where: { id: req.params.id },
    data: { active: false },
  });

  res.json({ message: "Categoría desactivada" });
}
