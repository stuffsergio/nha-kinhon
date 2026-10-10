import prisma from "../config/db.js";
import { localeFromAcceptLanguage, resolveLocale } from "../i18n/index.js";

export function localeMiddleware(req, _res, next) {
  req.locale = localeFromAcceptLanguage(req.headers["accept-language"]);
  next();
}

/** After authenticate: prefer stored user locale over Accept-Language. */
export async function attachUserLocale(req, _res, next) {
  if (!req.user?.id) return next();
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { locale: true },
    });
    req.locale = resolveLocale({
      userLocale: user?.locale,
      acceptLanguage: req.headers["accept-language"],
    });
  } catch {
    // keep Accept-Language locale
  }
  next();
}
