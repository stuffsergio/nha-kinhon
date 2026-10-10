import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/mapa", label: t("nav.map") },
    { to: "/buscar", label: t("nav.search") },
    { to: "/servicios", label: t("nav.services") },
    { to: "/supporters", label: t("nav.supporters") },
    { to: "/carrito", label: t("nav.cart") },
    { to: "/perfil", label: t("nav.profile") },
  ];

  return (
    <footer className="bg-surface-tile-1 text-white px-6 pt-14 pb-28 md:pb-6">
      <div className="max-w-[980px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div>
            <h3 className="font-apple-display text-[22px] font-semibold text-white mb-2">
              NHA KINHON
            </h3>
            <p className="font-apple-body text-[14px] text-body-muted leading-relaxed">
              {t("nav.tagline")}
            </p>
          </div>
          <div>
            <h4 className="font-apple-body text-[12px] font-semibold text-body-muted mb-4 uppercase tracking-[0.5px]">
              {t("nav.navigation")}
            </h4>
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="font-apple-body text-[14px] text-body-muted hover:text-white transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-apple-body text-[12px] font-semibold text-body-muted mb-4 uppercase tracking-[0.5px]">
              {t("nav.contact")}
            </h4>
            <ul className="space-y-2.5">
              <li className="font-apple-body text-[14px] text-body-muted">contacto@nhakinhon.com</li>
              <li className="font-apple-body text-[14px] text-body-muted">Bissau, Guinea-Bissau</li>
            </ul>
          </div>
        </div>
        <hr className="border-[#3a3a3c] mb-6" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-apple-body text-[12px] text-ink-muted-48">
            {t("nav.copyright", { year })}
          </p>
          <div className="flex gap-6">
            <Link
              to="/servicios"
              className="font-apple-body text-[12px] text-ink-muted-48 hover:text-white transition-colors duration-150"
            >
              {t("nav.services")}
            </Link>
            <Link
              to="/supporters"
              className="font-apple-body text-[12px] text-ink-muted-48 hover:text-white transition-colors duration-150"
            >
              {t("nav.supporters")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
