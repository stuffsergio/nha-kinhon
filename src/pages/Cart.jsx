import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CartList from "../components/CartList";
import CartSummary from "../components/CartSummary";
import EmptyCart from "../components/EmptyCart";

export default function Cart() {
  const { cart, cartTotal } = useCart();

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Carrito</h1>
        <Link
          to="/perfil"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Ver pedidos anteriores
        </Link>
      </div>

      {cart.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CartList />
          </div>
          <div>
            <CartSummary cartTotal={cartTotal} />
          </div>
        </div>
      )}
    </div>
  );
}
