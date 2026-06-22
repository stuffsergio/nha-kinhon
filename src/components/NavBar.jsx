import { Truck } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();

  return (
    <nav className="w-full max-w-[980px] mx-auto flex items-center justify-between py-4 px-6">
      <Link to="/" className="font-apple-display text-[24px] font-semibold tracking-[-0.36px] text-[#1d1d1f] hover:opacity-70 transition-opacity">
        Nha Kinhon
      </Link>

      <div className="flex items-center gap-6">
        <NavLink to="/mapa" className="font-apple-body text-[14px] text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors">
          Mapa
        </NavLink>
        <NavLink to="/buscar" className="font-apple-body text-[14px] text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors">
          Buscar
        </NavLink>
        <NavLink to="/servicios" className="font-apple-body text-[14px] text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors">
          Servicios
        </NavLink>
        <NavLink to="/supporters" className="font-apple-body text-[14px] text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors">
          Supporters
        </NavLink>
        <Link
          to={user?.role === "DELIVERY" ? "/delivery/dashboard" : "/delivery/login"}
          className="flex items-center gap-1.5 font-apple-body text-[14px] font-normal leading-[1.47] tracking-[-0.374px] text-[#059669] border border-[#059669] rounded-[9999px] px-[14px] py-[5px] hover:bg-[#059669] hover:text-white transition-colors"
        >
          <Truck size={16} />
          {user?.role === "DELIVERY" ? "Panel Repartidor" : "Quiero repartir"}
        </Link>
        {user?.role === "ADMIN" && (
          <Link to="/admin" className="font-apple-body text-[14px] text-[#dc2626] border border-[#dc2626] rounded-[9999px] px-[14px] py-[5px] hover:bg-[#dc2626] hover:text-white transition-colors">
            Admin
          </Link>
        )}
        {user && user.role !== "DELIVERY" ? (
          <div className="flex items-center gap-4">
            <Link to="/perfil" className="font-apple-body text-[14px] text-[#0066cc] hover:underline">
              {user.name}
            </Link>
            <button onClick={logout} className="font-apple-body text-[14px] text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors">
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
              className="font-apple-body text-[14px] font-normal leading-[1.47] tracking-[-0.374px] text-white bg-[#0066cc] rounded-[9999px] px-[16px] py-[6px] hover:bg-[#0071e3] transition-colors"
            >
              Registrarse
            </Link>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
