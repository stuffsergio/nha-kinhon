import { ShoppingCart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function EmptyCart() {
  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
          <ShoppingCart size={48} className="text-gray-400" />
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
      <p className="text-gray-600 mb-6">
        Agrega productos para comenzar tu pedido
      </p>
      <Link
        to="/buscar"
        className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
      >
        <span>Explorar Productos</span>
        <ArrowRight size={20} />
      </Link>
    </div>
  );
}
