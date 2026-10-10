import bcrypt from "bcrypt";
import prisma from "../config/db.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import { AppError, UnauthorizedError } from "../utils/errors.js";
import { resolveLocale } from "../i18n/index.js";
import { localeFromRequestBody } from "../utils/userLocale.js";
import { accessPayload, publicAuthUser } from "../utils/accessTokenPayload.js";

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function register(req, res) {
  const { name, email, password, phone, vehicle, serviceArea, locale: bodyLocale } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("El email ya está registrado", 409);

  const locale =
    bodyLocale !== undefined
      ? localeFromRequestBody(bodyLocale)
      : (req.locale ?? null);

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: "DELIVERY", locale },
  });

  await prisma.deliveryProfile.create({
    data: { userId: user.id, phone, vehicle, serviceArea: serviceArea || null },
  });

  const accessToken = signAccessToken(accessPayload(user));
  const refreshToken = signRefreshToken({ id: user.id });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);

  res.status(201).json({
    user: publicAuthUser(user),
    accessToken,
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "DELIVERY") {
    throw new UnauthorizedError("Credenciales incorrectas");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new UnauthorizedError("Credenciales incorrectas");

  req.locale = resolveLocale({
    userLocale: user.locale,
    acceptLanguage: req.headers?.["accept-language"],
  });

  const accessToken = signAccessToken(accessPayload(user));
  const refreshToken = signRefreshToken({ id: user.id });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);

  res.json({
    user: publicAuthUser(user),
    accessToken,
  });
}
