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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/20 shadow-lg z-50">
      <div className="max-w-md mx-auto flex justify-around items-center py-3 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                  isActive ? "text-black" : "text-gray-500 hover:text-gray-700"
                }`
              }
            >
              <Icon size={24} />
              <span className="text-xs">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
