const MAX_PHOTO_URL_LENGTH = 4_000_000;

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
  if (!isDataImage && !isHttp) {
    throw new Error("Formato de imagen no soportado");
  }
  return trimmed;
}

export function normalizePhotoList(body) {
  const { photos, photo } = body || {};
  if (Array.isArray(photos)) return photos.filter(Boolean);
  if (photo) return [photo];
  return [];
}
