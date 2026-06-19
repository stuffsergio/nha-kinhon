import { NavLink } from "react-router-dom";
import { Home, Map, Search, ShoppingCart, User } from "lucide-react";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";

export default function BottomNavBar() {
  const { cart } = useContext(CartContext);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/mapa", icon: Map, label: "Mapa" },
    { path: "/buscar", icon: Search, label: "Buscar" },
    { path: "/carrito", icon: ShoppingCart, label: "Carrito", badge: cartItemCount },
    { path: "/perfil", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#000000] h-[44px] z-50">
      <div className="max-w-md mx-auto h-full flex justify-around items-center px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 px-3 py-1 btn-apple-active ${
                  isActive ? "text-white" : "text-[#7a7a7a] hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              <span className="font-apple-body text-[12px] font-normal leading-[1.0] tracking-[-0.12px]">
                {item.label}
              </span>
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#0066cc] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
