import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CartList from "../components/CartList";
import CartSummary from "../components/CartSummary";
import EmptyCart from "../components/EmptyCart";

export default function Cart() {
  const { cart, cartTotal, loading } = useCart();

  return (
    <div className="w-full max-w-245 mx-auto py-[48px] md:py-[80px] px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="font-apple-display text-[34px] sm:text-[44px] md:text-[56px] font-semibold leading-[1.07] tracking-[-0.28px] text-[#1d1d1f]">
          Carrito
        </h1>
        <Link
          to="/perfil"
          className="text-primary font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px]"
        >
          Ver pedidos anteriores
        </Link>
      </div>

      {loading && cart.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow animate-pulse">
                <div className="h-7 bg-[#f5f5f7] rounded w-1/2 mb-3" />
                <div className="h-5 bg-[#f5f5f7] rounded w-1/3 mb-4" />
                <div className="h-9 bg-[#f5f5f7] rounded w-32" />
              </div>
            ))}
          </div>
          <div>
            <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow animate-pulse space-y-4">
              <div className="h-8 bg-[#f5f5f7] rounded w-2/3" />
              <div className="h-5 bg-[#f5f5f7] rounded w-full" />
              <div className="h-5 bg-[#f5f5f7] rounded w-full" />
              <div className="h-11 bg-[#f5f5f7] rounded-full w-full" />
            </div>
          </div>
        </div>
      ) : cart.length === 0 ? (
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
