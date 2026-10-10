import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="font-apple-display text-[80px] sm:text-[120px] font-semibold leading-[1] text-[#1d1d1f] mb-2">
          404
        </h1>
        <p className="font-apple-body text-[21px] text-[#7a7a7a] mb-8">{t("notFound.message")}</p>
        <Link
          to="/"
          className="inline-block bg-[#0066cc] text-white font-apple-body text-[17px] rounded-[9999px] px-[22px] py-[12px] hover:bg-[#0071e3] transition-colors"
        >
          {t("common.backHome")}
        </Link>
      </div>
    </div>
  );
}
