import { translateError } from "../i18n/index.js";

export function formatErrorResponse(err, locale) {
  const status = err.statusCode || err.status || 500;
  let code = err.code || null;
  let message = err.message || "Error interno del servidor";

  if (code) {
    message = translateError(code, locale, err.params || {});
  } else if (status === 404 && !code) {
    code = "ROUTE_NOT_FOUND";
    message = translateError(code, locale);
  } else if (status === 413) {
    code = "PAYLOAD_TOO_LARGE";
    message = translateError(code, locale);
  } else if (status === 429) {
    code = code || "RATE_LIMIT";
    message = translateError(code, locale);
  } else if (status >= 500) {
    code = code || "INTERNAL";
    message = translateError(code, locale);
  }

  const body = { error: message };
  if (code) body.code = code;
  return { status, body };
}
