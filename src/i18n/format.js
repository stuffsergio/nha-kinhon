const INTL_LOCALE = {
  es: "es-ES",
  pt: "pt-PT",
  pov: "pt-GW",
};

export function intlLocaleFor(i18nLang) {
  return INTL_LOCALE[i18nLang] || INTL_LOCALE.es;
}

export function formatFcfa(amount, locale = "es") {
  const intl = intlLocaleFor(locale);
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(intl, {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(n / 655.957);
}

export function formatFcfaRaw(amount, locale = "es") {
  const intl = intlLocaleFor(locale);
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return `${new Intl.NumberFormat(intl, { maximumFractionDigits: 0 }).format(n)} FCFA`;
}

export function formatDate(date, locale = "es", options = {}) {
  const intl = intlLocaleFor(locale);
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(intl, {
    dateStyle: "medium",
    ...options,
  }).format(d);
}

export function formatDateTime(date, locale = "es") {
  const intl = intlLocaleFor(locale);
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(intl, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}
