import prisma from "../config/db.js";
import { NotFoundError } from "../utils/errors.js";

export async function list(req, res) {
  const {
    page = 1, limit = 20, categoryId, marketId,
    search, minPrice, maxPrice, available,
  } = req.query;

  const where = {};
  if (categoryId) where.categoryId = categoryId;
  if (marketId) where.marketId = marketId;
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (minPrice) where.price = { ...where.price, gte: Number(minPrice) };
  if (maxPrice) where.price = { ...where.price, lte: Number(maxPrice) };
  if (available !== undefined) where.available = available === "true";

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: Number(limit),
      include: { category: true, market: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ data, total, page: Number(page), limit: Number(limit) });
}

export async function getById(req, res) {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true, market: true },
  });

  if (!product || !product.available) throw new NotFoundError("Producto");
  res.json({ product });
}

export async function create(req, res) {
  const product = await prisma.product.create({ data: req.body });
  res.status(201).json({ product });
}

export async function update(req, res) {
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json({ product });
}

export async function remove(req, res) {
  await prisma.product.update({
    where: { id: req.params.id },
    data: { available: false },
  });

  res.json({ message: "Producto desactivado" });
}

export async function uploadImage(req, res) {
  res.json({ message: "Subida de imágenes próximamente" });
}
