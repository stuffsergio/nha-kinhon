const MAX_PHOTO_URL_LENGTH = 4_000_000;
export const MAX_DECODED_IMAGE_BYTES = 2_000_000;
export const MAX_PHOTOS_PER_REQUEST = 5;
export const MAX_PHOTOS_PER_ORDER = 12;

function sniffImageMime(buffer) {
  if (!buffer || buffer.length < 3) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length < 12) return null;
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

function validateDataUrlImage(trimmed) {
  const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i.exec(trimmed);
  if (!match) {
    throw new Error("Formato de imagen no soportado");
  }
  const declared = match[1].toLowerCase().replace("jpg", "jpeg");
  let buffer;
  try {
    buffer = Buffer.from(match[2], "base64");
  } catch {
    throw new Error("Imagen base64 inválida");
  }
  if (buffer.length > MAX_DECODED_IMAGE_BYTES) {
    throw new Error("La imagen es demasiado grande");
  }
  const sniffed = sniffImageMime(buffer);
  if (!sniffed) {
    throw new Error("El contenido no coincide con una imagen JPEG, PNG o WebP");
  }
  const normalizedDeclared = declared.startsWith("image/")
    ? declared
    : `image/${declared}`;
  if (sniffed !== normalizedDeclared) {
    throw new Error("El tipo MIME no coincide con el contenido de la imagen");
  }
  return trimmed;
}

export function assertValidDeliveryPhotoUrl(url) {
  if (typeof url !== "string" || !url.trim()) {
    throw new Error("URL de foto inválida");
  }
  const trimmed = url.trim();
  if (trimmed.length > MAX_PHOTO_URL_LENGTH) {
    throw new Error("La imagen es demasiado grande");
  }
  const isDataImage = /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(trimmed);
  const isHttp = /^https?:\/\//i.test(trimmed);
  if (isDataImage) {
    return validateDataUrlImage(trimmed);
  }
  if (isHttp) {
    return trimmed;
  }
  throw new Error("Formato de imagen no soportado");
}

export function normalizePhotoList(body) {
  const { photos, photo } = body || {};
  if (Array.isArray(photos)) return photos.filter(Boolean);
  if (photo) return [photo];
  return [];
}
