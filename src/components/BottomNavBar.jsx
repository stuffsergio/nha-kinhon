import { NavLink } from "react-router-dom";
import { Home, Map, Search, ShoppingCart, User } from "lucide-react";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";

export default function BottomNavBar() {
  const { cart } = useContext(CartContext);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const navItems = [
    { path: "/", icon: Home, label: "Inicio" },
    { path: "/mapa", icon: Map, label: "Mapa" },
    { path: "/buscar", icon: Search, label: "Buscar" },
    {
      path: "/carrito",
      icon: ShoppingCart,
      label: "Carrito",
      badge: cartItemCount,
    },
    { path: "/perfil", icon: User, label: "Perfil" },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none pb-safe">
      <nav className="w-82 bg-black/20 backdrop-blur-sm border border-white/10 shadow-2xl rounded-2xl h-14 pointer-events-auto" aria-label="Navegaci\u00f3n principal">
        <div className="h-full w-full flex flex-row gap-3 justify-center items-center px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center gap-0 px-1 py-1 btn-apple-active min-w-0 flex-1 transition-colors duration-150 ${
                    isActive
                      ? "text-white"
                      : "text-ink-muted-80 hover:text-white"
                  }`
                }
                aria-label={item.label}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="font-apple-body text-[10px] font-normal leading-none tracking-[-0.1px]">
                  {item.label}
                </span>
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-medium">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
