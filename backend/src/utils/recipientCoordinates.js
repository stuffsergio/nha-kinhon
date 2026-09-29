import { AppError } from "./errors.js";
import { parseDestinationCoordinates } from "./orderTracking.js";

/**
 * Optional recipient lat/lng from checkout body. Both must be sent together or omitted.
 */
export function parseRecipientCoordinatesFromBody(body) {
  const rawLat = body?.recipientLat;
  const rawLng = body?.recipientLng;
  const hasLat = rawLat !== undefined && rawLat !== null && rawLat !== "";
  const hasLng = rawLng !== undefined && rawLng !== null && rawLng !== "";

  if (!hasLat && !hasLng) {
    return { recipientLat: undefined, recipientLng: undefined };
  }

  if (!hasLat || !hasLng) {
    throw new AppError("recipientLat y recipientLng deben enviarse juntos", 400);
  }

  const { lat, lng } = parseDestinationCoordinates(rawLat, rawLng);
  if (lat == null || lng == null) {
    throw new AppError("Coordenadas del destinatario fuera de rango", 400);
  }

  return { recipientLat: lat, recipientLng: lng };
}
