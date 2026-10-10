import bcrypt from "bcrypt";
import prisma from "../config/db.js";
import { signAccessToken, signRefreshToken, verifyToken } from "../utils/jwt.js";
import { NotFoundError, UnauthorizedError, codedError } from "../utils/errors.js";
import { resolveLocale, translateMessage } from "../i18n/index.js";
import { accessPayload, publicAuthUser } from "../utils/accessTokenPayload.js";
import { localeFromRequestBody } from "../utils/userLocale.js";

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function publicUser(user) {
  return {
    ...publicAuthUser(user),
    balance: user.balance,
    phone: user.phone,
    avatar: user.avatar,
  };
}

export async function register(req, res) {
  const { name, email, password, locale: bodyLocale } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw codedError("EMAIL_REGISTERED", 409);

  const locale =
    bodyLocale !== undefined ? localeFromRequestBody(bodyLocale) : req.locale;

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, locale },
  });

  const accessToken = signAccessToken(accessPayload(user));
  const refreshToken = signRefreshToken({ id: user.id });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);

  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      locale: user.locale,
    },
    accessToken,
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new UnauthorizedError("Credenciales incorrectas", "CREDENTIALS_INVALID");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new UnauthorizedError("Credenciales incorrectas", "CREDENTIALS_INVALID");

  const accessToken = signAccessToken(accessPayload(user));
  const refreshToken = signRefreshToken({ id: user.id });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);

  res.json({
    user: publicUser(user),
    accessToken,
  });
}

export async function refresh(req, res) {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) throw new UnauthorizedError("Refresh token requerido", "REFRESH_REQUIRED");

  let decoded;
  try {
    decoded = verifyToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Refresh token inválido o expirado", "REFRESH_INVALID");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || user.refreshToken !== refreshToken) {
    throw new UnauthorizedError("Refresh token inválido", "REFRESH_MISMATCH");
  }

  const newAccess = signAccessToken(accessPayload(user));
  const newRefresh = signRefreshToken({ id: user.id });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefresh },
  });

  res.cookie("refreshToken", newRefresh, REFRESH_COOKIE_OPTS);

  res.json({ accessToken: newAccess });
}

export async function logout(req, res) {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { refreshToken: null },
  });

  res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "none" });
  res.json({ message: translateMessage("LOGOUT_OK", req.locale), code: "LOGOUT_OK" });
}

export async function getMe(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, name: true, email: true, phone: true,
      avatar: true, balance: true, role: true, locale: true,
      createdAt: true,
    },
  });

  if (!user) throw new NotFoundError("Usuario");

  req.locale = resolveLocale({
    userLocale: user.locale,
    acceptLanguage: req.headers?.["accept-language"],
  });

  res.json({ user });
}

export async function updateMe(req, res) {
  const { name, email, phone, avatar, locale: bodyLocale } = req.body;

  if (email) {
    const existing = await prisma.user.findFirst({
      where: { email, NOT: { id: req.user.id } },
    });
    if (existing) throw codedError("EMAIL_IN_USE", 409);
  }

  const data = { name, email, phone, avatar };
  const localeValue = localeFromRequestBody(bodyLocale);
  if (localeValue !== undefined) data.locale = localeValue;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: {
      id: true, name: true, email: true, phone: true,
      avatar: true, balance: true, role: true, locale: true,
    },
  });

  req.locale = resolveLocale({
    userLocale: user.locale,
    acceptLanguage: req.headers?.["accept-language"],
  });

  res.json({ user });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw codedError("PASSWORD_WRONG", 400);

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, refreshToken: null },
  });

  res.json({
    message: translateMessage("PASSWORD_UPDATED", req.locale),
    code: "PASSWORD_UPDATED",
  });
}
