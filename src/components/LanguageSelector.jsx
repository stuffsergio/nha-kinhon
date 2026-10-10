import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { SUPPORTED_LOCALES } from "../i18n/config";

const LOCALE_META = {
  es: { short: "ES", labelKey: "language.es" },
  pt: { short: "PT", labelKey: "language.pt" },
  pov: { short: "KR", labelKey: "language.pov" },
};

export default function LanguageSelector({ compact = false, className = "" }) {
  const { t, i18n } = useTranslation();
  const { setLocale, user } = useAuth();
  const current = SUPPORTED_LOCALES.includes(i18n.language) ? i18n.language : "es";

  const handleChange = (e) => {
    const next = e.target.value;
    if (next && next !== current) {
      setLocale(next);
    }
  };

  const base =
    "font-apple-body text-[13px] text-[#1d1d1f] bg-[#f5f5f7]/80 border border-[#e0e0e0] rounded-[9999px] pl-2 pr-2 py-1.5 focus-visible:outline-2 focus-visible:outline-[#0071e3] focus-visible:outline-offset-2 cursor-pointer appearance-none";

  return (
    <label
      className={`inline-flex items-center gap-1.5 ${compact ? "" : "shrink-0"} ${className}`}
      title={t("language.label")}
    >
      <Globe size={compact ? 14 : 16} className="text-[#7a7a7a] shrink-0" aria-hidden="true" />
      <select
        value={current}
        onChange={handleChange}
        aria-label={t("language.selectAria")}
        className={`${base} ${compact ? "max-w-[5.5rem]" : "min-w-[7rem]"}`}
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {compact ? LOCALE_META[code].short : t(LOCALE_META[code].labelKey)}
          </option>
        ))}
      </select>
      {!user && compact ? null : null}
    </label>
  );
}
