import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "./locales/es.json";
import pt from "./locales/pt.json";
import pov from "./locales/pov.json";

export const LOCALE_STORAGE_KEY = "nha_kinhon_locale";
export const SUPPORTED_LOCALES = ["es", "pt", "pov"];

function normalizeLocale(code) {
  if (!code) return null;
  const base = String(code).toLowerCase().split("-")[0];
  if (base === "pov" || code.toLowerCase().startsWith("pov")) return "pov";
  if (base === "pt") return "pt";
  if (base === "es") return "es";
  return null;
}

export function detectInitialLanguage() {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    const fromStorage = normalizeLocale(stored);
    if (fromStorage && SUPPORTED_LOCALES.includes(fromStorage)) return fromStorage;
  } catch {
    /* private mode */
  }
  const fromNav = normalizeLocale(navigator.language);
  if (fromNav) return fromNav;
  return "es";
}

export function persistLocale(locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    pt: { translation: pt },
    pov: { translation: pov },
  },
  lng: detectInitialLanguage(),
  fallbackLng: {
    pov: ["pt", "es"],
    pt: ["es"],
    default: ["es"],
  },
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

export function applyUserLocale(userLocale) {
  const norm = normalizeLocale(userLocale);
  if (norm && SUPPORTED_LOCALES.includes(norm) && i18n.language !== norm) {
    i18n.changeLanguage(norm);
    persistLocale(norm);
  }
}

export default i18n;
