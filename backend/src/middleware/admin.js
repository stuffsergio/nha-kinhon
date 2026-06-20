import { ForbiddenError } from "../utils/errors.js";

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    throw new ForbiddenError("Se requieren permisos de administrador");
  }
  next();
}
