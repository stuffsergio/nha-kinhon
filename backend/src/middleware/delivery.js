import { ForbiddenError } from "../utils/errors.js";

export function requireDelivery(req, res, next) {
  if (req.user?.role !== "DELIVERY") {
    throw new ForbiddenError("Se requieren permisos de repartidor");
  }
  next();
}
