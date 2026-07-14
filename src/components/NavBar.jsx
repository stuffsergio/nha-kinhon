import { useState } from "react";
import { Truck, Menu, X } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const safeLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/");
  };

  const homeLink = user ? "/inicio" : "/";

  const linkClass = ({ isActive }) =>
    `font-apple-body text-[14px] transition-colors duration-150 ${
      isActive ? "text-[#1d1d1f] font-semibold" : "text-[#7a7a7a] hover:text-[#1d1d1f]"
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `font-apple-body text-[16px] py-2 transition-colors duration-150 ${
      isActive ? "text-[#1d1d1f] font-semibold" : "text-[#7a7a7a] hover:text-[#1d1d1f]"
    }`;

  const deliveryBtnClass =
    "flex items-center gap-1.5 font-apple-body text-[14px] font-normal leading-[1.47] tracking-[-0.374px] text-[#059669] border border-[#059669] rounded-[9999px] px-[14px] py-[5px] hover:bg-[#059669] hover:text-white transition-colors duration-150";

  const navLinks = [
    { to: "/mapa", label: "Mapa" },
    { to: "/buscar", label: "Buscar" },
    { to: "/servicios", label: "Servicios" },
    { to: "/supporters", label: "Supporters" },
  ];

  return (
    <nav className="w-full max-w-[980px] mx-auto px-6">
      <div className="flex items-center justify-between py-4">
        <Link
          to={homeLink}
          className="font-apple-display text-[22px] sm:text-[24px] font-semibold tracking-[-0.36px] text-[#1d1d1f] hover:opacity-70 transition-opacity duration-150"
        >
          Nha Kinhon
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}

          <Link
            to={user?.role === "DELIVERY" ? "/delivery/dashboard" : "/delivery/login"}
            className={deliveryBtnClass}
          >
            <Truck size={16} aria-hidden="true" />
            {user?.role === "DELIVERY" ? "Panel Repartidor" : "Quiero repartir"}
          </Link>

          {user?.role === "ADMIN" && (
            <Link
              to="/admin"
              className="font-apple-body text-[14px] text-[#dc2626] border border-[#dc2626] rounded-[9999px] px-[14px] py-[5px] hover:bg-[#dc2626] hover:text-white transition-colors duration-150"
            >
              Admin
            </Link>
          )}

          {user && user.role !== "DELIVERY" ? (
            <div className="flex items-center gap-4">
              <Link to="/perfil" className="font-apple-body text-[14px] text-[#0066cc] hover:underline">
                {user.name}
              </Link>
              <button onClick={safeLogout} className="font-apple-body text-[14px] text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors duration-150">
                Salir
              </button>
            </div>
          ) : !user ? (
            <div className="flex items-center gap-3">
              <Link to="/login" className="font-apple-body text-[14px] text-[#0066cc] hover:underline">
                Iniciar Sesión
              </Link>
              <Link
                to="/login?mode=register"
                className="font-apple-body text-[14px] font-normal leading-[1.47] tracking-[-0.374px] text-white bg-[#0066cc] rounded-[9999px] px-[16px] py-[6px] hover:bg-[#0071e3] transition-colors duration-150"
              >
                Registrarse
              </Link>
            </div>
          ) : null}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden p-2 -mr-2 text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-[8px] transition-colors"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div
          className="md:hidden border-t border-[#e0e0e0] py-3 flex flex-col animate-fade-in"
          onClick={() => setMenuOpen(false)}
        >
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} className={mobileLinkClass}>
              {l.label}
            </NavLink>
          ))}

          <Link
            to={user?.role === "DELIVERY" ? "/delivery/dashboard" : "/delivery/login"}
            className="mt-3 inline-flex items-center gap-1.5 self-start font-apple-body text-[15px] text-[#059669] border border-[#059669] rounded-[9999px] px-[14px] py-[6px] hover:bg-[#059669] hover:text-white transition-colors duration-150"
          >
            <Truck size={16} aria-hidden="true" />
            {user?.role === "DELIVERY" ? "Panel Repartidor" : "Quiero repartir"}
          </Link>

          {user?.role === "ADMIN" && (
            <Link
              to="/admin"
              className="mt-3 inline-flex self-start font-apple-body text-[15px] text-[#dc2626] border border-[#dc2626] rounded-[9999px] px-[14px] py-[6px] hover:bg-[#dc2626] hover:text-white transition-colors duration-150"
            >
              Admin
            </Link>
          )}

          <div className="mt-4 pt-4 border-t border-[#e0e0e0] flex items-center gap-4">
            {user && user.role !== "DELIVERY" ? (
              <>
                <Link to="/perfil" className="font-apple-body text-[15px] text-[#0066cc] hover:underline">
                  {user.name}
                </Link>
                <button onClick={safeLogout} className="font-apple-body text-[15px] text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors duration-150">
                  Salir
                </button>
              </>
            ) : !user ? (
              <>
                <Link to="/login" className="font-apple-body text-[15px] text-[#0066cc] hover:underline">
                  Iniciar Sesión
                </Link>
                <Link
                  to="/login?mode=register"
                  className="font-apple-body text-[15px] text-white bg-[#0066cc] rounded-[9999px] px-[16px] py-[7px] hover:bg-[#0071e3] transition-colors duration-150"
                >
                  Registrarse
                </Link>
              </>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
}
