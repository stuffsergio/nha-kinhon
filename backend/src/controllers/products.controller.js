import prisma from "../config/db.js";
import { NotFoundError } from "../utils/errors.js";
import { parseProductSort } from "../utils/search.js";

export async function list(req, res) {
  const {
    page = 1, limit = 20, categoryId, marketId,
    search, q, minPrice, maxPrice, available, sort,
  } = req.query;

  const where = {};
  if (categoryId) where.categoryId = categoryId;
  if (marketId) where.marketId = marketId;

  const searchTerm = search || q;
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  if (minPrice) where.price = { ...where.price, gte: Number(minPrice) };
  if (maxPrice) where.price = { ...where.price, lte: Number(maxPrice) };

  if (available === "false") {
    where.available = false;
  } else if (available !== "all") {
    where.available = true;
  }

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: Number(limit),
      include: { category: true, market: true },
      orderBy: parseProductSort(sort),
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
