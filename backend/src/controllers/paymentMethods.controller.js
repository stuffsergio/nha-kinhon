import prisma from "../config/db.js";
import { NotFoundError } from "../utils/errors.js";

export async function list(req, res) {
  const methods = await prisma.paymentMethod.findMany({
    where: { userId: req.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  res.json({ data: methods });
}

export async function create(req, res) {
  const count = await prisma.paymentMethod.count({
    where: { userId: req.user.id },
  });

  const data = { ...req.body, userId: req.user.id, isDefault: count === 0 };

  const method = await prisma.paymentMethod.create({ data });
  res.status(201).json({ paymentMethod: method });
}

export async function update(req, res) {
  const method = await prisma.paymentMethod.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!method) throw new NotFoundError("Método de pago");

  const updated = await prisma.paymentMethod.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json({ paymentMethod: updated });
}

export async function setDefault(req, res) {
  const method = await prisma.paymentMethod.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!method) throw new NotFoundError("Método de pago");

  await prisma.paymentMethod.updateMany({
    where: { userId: req.user.id },
    data: { isDefault: false },
  });

  const updated = await prisma.paymentMethod.update({
    where: { id: req.params.id },
    data: { isDefault: true },
  });

  res.json({ paymentMethod: updated });
}

export async function remove(req, res) {
  const method = await prisma.paymentMethod.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!method) throw new NotFoundError("Método de pago");

  await prisma.paymentMethod.delete({ where: { id: req.params.id } });
  res.json({ message: "Método de pago eliminado" });
}
