import { verifyToken } from "../utils/jwt.js";
import { UnauthorizedError } from "../utils/errors.js";

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token no proporcionado");
  }

  const token = header.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    throw new UnauthorizedError("Token inválido o expirado");
  }
}
