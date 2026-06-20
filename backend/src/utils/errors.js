export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Recurso") {
    super(`${resource} no encontrado`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "No autorizado") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acceso denegado") {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Datos inválidos") {
    super(message, 400);
  }
}
