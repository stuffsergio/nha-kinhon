import { verifyToken } from "../utils/jwt.js";
import { UnauthorizedError } from "../utils/errors.js";
import { resolveLocale } from "../i18n/index.js";

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token no proporcionado", "TOKEN_MISSING");
  }

  const token = header.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    req.locale = resolveLocale({
      userLocale: decoded.locale,
      acceptLanguage: req.headers["accept-language"],
    });
    next();
  } catch {
    throw new UnauthorizedError("Token inválido o expirado", "TOKEN_INVALID");
  }
}
