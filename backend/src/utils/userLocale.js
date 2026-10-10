import { codedError } from "./errors.js";
import { isSupportedLocale, normalizeLocale } from "../i18n/index.js";

/**
 * Maps `{ locale }` from PUT body to a Prisma update value.
 * @returns {undefined | null | string} undefined = omit field from update
 */
export function localeFromRequestBody(bodyLocale) {
  if (bodyLocale === undefined) return undefined;
  if (bodyLocale === null || bodyLocale === "") return null;
  const norm = normalizeLocale(bodyLocale);
  if (!norm || !isSupportedLocale(norm)) throw codedError("LOCALE_INVALID", 400);
  return norm;
}
