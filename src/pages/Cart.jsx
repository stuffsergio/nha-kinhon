import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CartList from "../components/CartList";
import CartSummary from "../components/CartSummary";
import EmptyCart from "../components/EmptyCart";

export default function Cart() {
  const { cart, cartTotal } = useCart();

  return (
    <div className="w-full max-w-245 mx-auto py-[80px] px-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-apple-display text-[56px] font-semibold leading-[1.07] tracking-[-0.28px] text-[#1d1d1f]">
          Carrito
        </h1>
        <Link
          to="/perfil"
          className="text-primary font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px]"
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
