import bcrypt from "bcrypt";
import prisma from "../config/db.js";
import { signAccessToken, signRefreshToken, verifyToken } from "../utils/jwt.js";
import { AppError, NotFoundError, UnauthorizedError } from "../utils/errors.js";

export async function register(req, res) {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("El email ya está registrado", 409);

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new UnauthorizedError("Credenciales incorrectas");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new UnauthorizedError("Credenciales incorrectas");

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      balance: user.balance,
      phone: user.phone,
      avatar: user.avatar,
    },
    accessToken,
    refreshToken,
  });
}

export async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new UnauthorizedError("Refresh token requerido");

  let decoded;
  try {
    decoded = verifyToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Refresh token inválido o expirado");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || user.refreshToken !== refreshToken) {
    throw new UnauthorizedError("Refresh token inválido");
  }

  const newAccess = signAccessToken({ id: user.id, role: user.role });
  const newRefresh = signRefreshToken({ id: user.id });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefresh },
  });

  res.json({ accessToken: newAccess, refreshToken: newRefresh });
}

export async function logout(req, res) {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { refreshToken: null },
  });

  res.clearCookie("refreshToken");
  res.json({ message: "Sesión cerrada" });
}

export async function getMe(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, name: true, email: true, phone: true,
      avatar: true, balance: true, role: true,
      createdAt: true,
    },
  });

  if (!user) throw new NotFoundError("Usuario");

  res.json({ user });
}

export async function updateMe(req, res) {
  const { name, email, phone, avatar } = req.body;

  if (email) {
    const existing = await prisma.user.findFirst({
      where: { email, NOT: { id: req.user.id } },
    });
    if (existing) throw new AppError("El email ya está en uso", 409);
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name, email, phone, avatar },
    select: {
      id: true, name: true, email: true, phone: true,
      avatar: true, balance: true, role: true,
    },
  });

  res.json({ user });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new AppError("Contraseña actual incorrecta", 400);

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, refreshToken: null },
  });

  res.json({ message: "Contraseña actualizada. Vuelve a iniciar sesión." });
}
