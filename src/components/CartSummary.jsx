import { useCart } from "../context/CartContext";
import ButtonPrimary from "./ButtonPrimary";

export default function CartSummary({ cartTotal }) {
  const { cart, clearCart } = useCart();

  const handleCheckout = () => {
    alert("Funcionalidad de checkout próximamente disponible");
  };

  return (
    <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow space-y-4">
      <h2 className="font-apple-display text-[34px] font-semibold leading-[1.47] tracking-[-0.374px] text-[#1d1d1f]">
        Resumen del Pedido
      </h2>
      
      <div className="space-y-3">
        <div className="flex justify-between font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
          <span>Subtotal</span>
          <span>{cartTotal.toLocaleString()} FCFA</span>
        </div>
        <div className="flex justify-between font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
          <span>Envío</span>
          <span>Gratis</span>
        </div>
        <div className="border-t border-[#e0e0e0] pt-3 flex justify-between font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f]">
          <span>Total</span>
          <span>{cartTotal.toLocaleString()} FCFA</span>
        </div>
      </div>

      <ButtonPrimary
        onClick={handleCheckout}
        disabled={cart.length === 0}
        className="w-full disabled:bg-[#d2d2d7] disabled:cursor-not-allowed"
      >
        Proceder al Pago
      </ButtonPrimary>

      {cart.length > 0 && (
        <button
          onClick={clearCart}
          className="w-full text-[#0066cc] font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] py-3 rounded-[9999px] hover:bg-[#f5f5f7] transition-colors"
        >
          Vaciar Carrito
        </button>
      )}
    </div>
  );
}
