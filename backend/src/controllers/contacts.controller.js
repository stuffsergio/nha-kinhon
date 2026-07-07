import prisma from "../config/db.js";
import { NotFoundError } from "../utils/errors.js";

export async function list(req, res) {
  const contacts = await prisma.contact.findMany({
    where: { userId: req.user.id },
    orderBy: { name: "asc" },
  });

  res.json({ data: contacts });
}

export async function getById(req, res) {
  const contact = await prisma.contact.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!contact) throw new NotFoundError("Contacto");

  res.json({ contact });
}

export async function create(req, res) {
  const { name, phone } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }
  if (!phone?.trim()) {
    return res.status(400).json({ error: "El teléfono es obligatorio" });
  }

  const contact = await prisma.contact.create({
    data: { ...req.body, userId: req.user.id },
  });

  res.status(201).json({ contact });
}

export async function update(req, res) {
  const contact = await prisma.contact.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!contact) throw new NotFoundError("Contacto");

  const updated = await prisma.contact.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json({ contact: updated });
}

export async function remove(req, res) {
  const contact = await prisma.contact.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!contact) throw new NotFoundError("Contacto");

  await prisma.contact.delete({ where: { id: req.params.id } });
  res.json({ message: "Contacto eliminado" });
}
