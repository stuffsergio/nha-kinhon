import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useCheckout } from "../hooks/useOrders";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import ButtonPrimary from "./ButtonPrimary";

export default function CartSummary({ cartTotal }) {
  const { cart, clearCart } = useCart();
  const checkout = useCheckout();
  const navigate = useNavigate();
  const toast = useToast();
  const [checkingOut, setCheckingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [notes, setNotes] = useState("");

  const handleCheckout = () => {
    if (!recipientName.trim()) { toast("Introduce el nombre del destinatario", "error"); return; }
    if (!recipientPhone.trim()) { toast("Introduce el teléfono del destinatario", "error"); return; }
    if (!recipientAddress.trim()) { toast("Introduce la dirección del destinatario", "error"); return; }
    setShowConfirm(true);
  };

  const confirmCheckout = async () => {
    setShowConfirm(false);
    setCheckingOut(true);
    try {
      const data = await checkout.mutateAsync({
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        recipientAddress: recipientAddress.trim(),
        notes: notes.trim(),
        paymentMethodId: null,
      });
      const orderId = data.order?.id || data.id;
      const session = await api.post("/stripe/create-checkout-session", { orderId });
      navigate("/checkout", {
        state: { clientSecret: session.clientSecret, orderId, cartTotal },
        replace: true,
      });
    } catch (e) {
      toast("Error al crear el pedido: " + e.message, "error");
      setCheckingOut(false);
    }
  };

  return (
    <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow space-y-4">
      <h2 className="font-apple-display text-[34px] font-semibold leading-[1.47] tracking-[-0.374px] text-[#1d1d1f]">
        Resumen del Pedido
      </h2>

      <div className="space-y-4 border-b border-[#e0e0e0] pb-4">
        <h3 className="font-apple-body text-[14px] font-semibold text-[#7a7a7a] uppercase tracking-[0.5px]">
          Datos del Destinatario
        </h3>
        <div>
          <label className="block font-apple-body text-[14px] text-[#7a7a7a] mb-1">Nombre completo *</label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Nombre del destinatario"
            className="w-full px-4 py-2 border border-[#e0e0e0] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0071e3] font-apple-body text-[17px]"
          />
        </div>
        <div>
          <label className="block font-apple-body text-[14px] text-[#7a7a7a] mb-1">Teléfono *</label>
          <input
            type="tel"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="+245 XXX XXX XXX"
            className="w-full px-4 py-2 border border-[#e0e0e0] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0071e3] font-apple-body text-[17px]"
          />
        </div>
        <div>
          <label className="block font-apple-body text-[14px] text-[#7a7a7a] mb-1">Dirección *</label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="Dirección completa en Guinea-Bissau"
            className="w-full px-4 py-2 border border-[#e0e0e0] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0071e3] font-apple-body text-[17px]"
          />
        </div>
        <div>
          <label className="block font-apple-body text-[14px] text-[#7a7a7a] mb-1">Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instrucciones especiales..."
            rows={2}
            className="w-full px-4 py-2 border border-[#e0e0e0] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0071e3] font-apple-body text-[17px] resize-none"
          />
        </div>
      </div>

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
        disabled={cart.length === 0 || checkingOut}
        className="w-full disabled:bg-[#d2d2d7] disabled:cursor-not-allowed"
      >
        {checkingOut ? "Preparando pago..." : "Proceder al Pago"}
      </ButtonPrimary>

      {cart.length > 0 && (
        <button
          onClick={() => {
            if (window.confirm("¿Vaciar el carrito? Se perderán todos los productos añadidos.")) {
              clearCart();
              toast("Carrito vaciado", "info");
            }
          }}
          className="w-full text-[#0066cc] font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] py-3 rounded-[9999px] hover:bg-[#f5f5f7] transition-colors"
        >
          Vaciar Carrito
        </button>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative min-h-full flex items-center justify-center p-6">
            <div className="relative bg-[#ffffff] rounded-[18px] no-shadow w-full max-w-[420px] p-8 animate-fade-in">
              <h3 className="font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f] mb-4">
                Confirmar Pedido
              </h3>
              <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a] mb-6">
                ¿Estás seguro de realizar este pedido de <strong className="text-[#1d1d1f]">{cartTotal.toLocaleString()} FCFA</strong> para <strong className="text-[#1d1d1f]">{recipientName}</strong>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-3 border border-[#e0e0e0] rounded-[9999px] font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmCheckout}
                  className="flex-1 px-4 py-3 bg-[#0066cc] text-white rounded-[9999px] font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] hover:bg-[#0071e3] transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
