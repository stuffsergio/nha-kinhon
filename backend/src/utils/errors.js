import { translateError } from "../i18n/index.js";

export class AppError extends Error {
  /**
   * @param {string} message - fallback / log message (often Spanish)
   * @param {number} [statusCode]
   * @param {string | null} [code] - stable API error code for clients
   * @param {Record<string, string | number>} [params]
   */
  constructor(message, statusCode = 500, code = null, params = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.params = params;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Recurso") {
    super(`${resource} no encontrado`, 404, "NOT_FOUND", { resource });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "No autorizado", code = "UNAUTHORIZED") {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acceso denegado", code = "FORBIDDEN") {
    super(message, 403, code);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Datos inválidos") {
    super(message, 400, "VALIDATION");
  }
}

/** @param {string} code @param {number} status @param {Record<string, string | number>} [params] */
export function codedError(code, status, params = {}) {
  const message = translateError(code, "es", params);
  return new AppError(message, status, code, params);
}
