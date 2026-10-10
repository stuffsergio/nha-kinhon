import es from "./locales/es.js";
import pt from "./locales/pt.js";
import pov from "./locales/pov.js";

export const SUPPORTED_LOCALES = ["es", "pt", "pov"];
export const DEFAULT_LOCALE = "es";

const catalogs = { es, pt, pov };

/** @type {Record<string, string[]>} */
const FALLBACK_CHAIN = {
  es: ["es"],
  pt: ["pt", "es"],
  pov: ["pov", "pt", "es"],
};

export function normalizeLocale(raw) {
  if (!raw || typeof raw !== "string") return null;
  const base = raw.trim().toLowerCase().split(/[-_]/)[0];
  if (base === "pov" || raw.toLowerCase().startsWith("pov")) return "pov";
  if (base === "pt") return "pt";
  if (base === "es") return "es";
  return null;
}

/**
 * Parse Accept-Language (first supported tag wins).
 * @param {string | undefined} header
 */
export function localeFromAcceptLanguage(header) {
  if (!header) return DEFAULT_LOCALE;
  const parts = header.split(",").map((p) => p.trim().split(";")[0]);
  for (const part of parts) {
    const norm = normalizeLocale(part);
    if (norm) return norm;
  }
  return DEFAULT_LOCALE;
}

export function resolveLocale({ userLocale, acceptLanguage } = {}) {
  const fromUser = normalizeLocale(userLocale);
  if (fromUser) return fromUser;
  return localeFromAcceptLanguage(acceptLanguage);
}

function getNested(catalog, key) {
  const segments = key.split(".");
  let cur = catalog;
  for (const seg of segments) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[seg];
  }
  return cur;
}

function interpolate(template, params = {}) {
  if (typeof template !== "string") return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) => {
    const v = params[name];
    return v === undefined || v === null ? "" : String(v);
  });
}

/**
 * @param {string} key - dot path, e.g. errors.NOT_FOUND or notifications.ORDER_DELIVERED.title
 * @param {string} [locale]
 * @param {Record<string, string | number>} [params]
 */
export function t(key, locale = DEFAULT_LOCALE, params = {}) {
  const chain = FALLBACK_CHAIN[locale] || FALLBACK_CHAIN[DEFAULT_LOCALE];
  for (const loc of chain) {
    const catalog = catalogs[loc];
    const raw = getNested(catalog, key);
    if (typeof raw === "string") {
      return interpolate(raw, params);
    }
  }
  return key;
}

export function translateNotification(templateKey, locale, params = {}) {
  return {
    title: t(`notifications.${templateKey}.title`, locale, params),
    message: t(`notifications.${templateKey}.message`, locale, params),
  };
}

export function translateError(code, locale, params = {}) {
  if (code === "NOT_FOUND" && params.resource) {
    const resourceLabel = t(`resources.${params.resource}`, locale) || params.resource;
    return t("errors.NOT_FOUND", locale, { resource: resourceLabel });
  }
  return t(`errors.${code}`, locale, params);
}

export function translateMessage(code, locale) {
  return t(`messages.${code}`, locale);
}

export function isSupportedLocale(value) {
  return SUPPORTED_LOCALES.includes(value);
}
