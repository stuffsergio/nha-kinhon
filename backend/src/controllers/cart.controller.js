import prisma from "../config/db.js";
import { NotFoundError } from "../utils/errors.js";

export async function getCart(req, res) {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user.id },
    include: { product: { include: { market: true } } },
    orderBy: { createdAt: "asc" },
  });

  res.json({ items });
}

export async function addItem(req, res) {
  const { productId, quantity = 1 } = req.body;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || !product.available) {
    throw new NotFoundError("Producto");
  }

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: req.user.id, productId } },
  });

  let item;
  if (existing) {
    item = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
      include: { product: true },
    });
  } else {
    item = await prisma.cartItem.create({
      data: { userId: req.user.id, productId, quantity },
      include: { product: true },
    });
  }

  res.status(201).json({ item });
}

export async function updateItem(req, res) {
  const { quantity } = req.body;

  const item = await prisma.cartItem.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!item) throw new NotFoundError("Item del carrito");

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return res.json({ message: "Item eliminado" });
  }

  const updated = await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
    include: { product: true },
  });

  res.json({ item: updated });
}

export async function removeItem(req, res) {
  const item = await prisma.cartItem.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!item) throw new NotFoundError("Item del carrito");

  await prisma.cartItem.delete({ where: { id: item.id } });
  res.json({ message: "Item eliminado" });
}

export async function clearCart(req, res) {
  await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
  res.json({ message: "Carrito vaciado" });
}
