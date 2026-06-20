import prisma from "../config/db.js";

export async function list(req, res) {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user.id },
    include: { product: { include: { market: true, category: true } } },
    orderBy: { createdAt: "desc" },
  });

  const products = favorites.map((f) => f.product);
  res.json({ data: products });
}

export async function add(req, res) {
  const { productId } = req.params;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.available) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  await prisma.favorite.upsert({
    where: { userId_productId: { userId: req.user.id, productId } },
    update: {},
    create: { userId: req.user.id, productId },
  });

  res.status(201).json({ message: "Añadido a favoritos" });
}

export async function remove(req, res) {
  const { productId } = req.params;

  await prisma.favorite.deleteMany({
    where: { userId: req.user.id, productId },
  });

  res.json({ message: "Eliminado de favoritos" });
}
