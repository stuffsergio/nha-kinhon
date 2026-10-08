import { AppError } from "../utils/errors.js";
import { isOriginAllowed } from "../config/runtime.js";

/**
 * Rejects cookie-auth mutations when a cross-site Origin/Referer is present (CSRF).
 * Native clients without Origin/Referer are allowed (Bearer-only flows).
 */
export function requireSameSiteOrigin(req, res, next) {
  const origin = req.headers.origin;
  if (origin) {
    if (!isOriginAllowed(origin)) {
      throw new AppError("Origen no permitido", 403);
    }
    return next();
  }

  const referer = req.headers.referer;
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (!isOriginAllowed(refOrigin)) {
        throw new AppError("Origen no permitido", 403);
      }
    } catch {
      throw new AppError("Referer inválido", 403);
    }
  }

  next();
}
