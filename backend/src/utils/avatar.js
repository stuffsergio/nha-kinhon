import {
  MAX_DECODED_IMAGE_BYTES,
  assertValidDataUrlImage,
} from "./deliveryPhoto.js";

const MAX_AVATAR_URL_LENGTH = 4_000_000;

/**
 * Validates user avatar: null (delete), or a data-URL image (JPEG/PNG/WebP, magic bytes, ≤2 MB decoded).
 * @param {unknown} avatar
 * @returns {null | string}
 */
export function assertValidAvatarValue(avatar) {
  if (avatar === null) return null;
  if (typeof avatar !== "string" || !avatar.trim()) {
    throw new Error("Avatar inválido");
  }
  const trimmed = avatar.trim();
  if (trimmed.length > MAX_AVATAR_URL_LENGTH) {
    throw new Error("La imagen es demasiado grande");
  }
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(trimmed)) {
    throw new Error(
      "Formato de avatar no soportado; use JPEG, PNG o WebP codificado en base64",
    );
  }
  return assertValidDataUrlImage(trimmed);
}

export { MAX_DECODED_IMAGE_BYTES };
