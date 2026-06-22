import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckoutElementsProvider } from "@stripe/react-stripe-js/checkout";
import { loadStripe } from "@stripe/stripe-js";
import { useCart } from "../context/CartContext";
import { useCheckout } from "../hooks/useOrders";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import ButtonPrimary from "./ButtonPrimary";
import StripePaymentForm from "./StripePaymentForm";

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null;

export default function CartSummary({ cartTotal }) {
  const { cart, clearCart } = useCart();
  const checkout = useCheckout();
  const navigate = useNavigate();
  const toast = useToast();
  const [checkingOut, setCheckingOut] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [pendingOrderId, setPendingOrderId] = useState(null);

  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [notes, setNotes] = useState("");

  const handleCheckout = () => {
    if (!recipientName.trim()) { toast("Introduce el nombre del destinatario", "error"); return; }
    if (!recipientPhone.trim()) { toast("Introduce el teléfono del destinatario", "error"); return; }
    if (!recipientAddress.trim()) { toast("Introduce la dirección del destinatario", "error"); return; }
    if (!PUBLISHABLE_KEY) { toast("El sistema de pago no está configurado", "error"); return; }
    setShowConfirm(true);
  };

  const confirmCheckout = async () => {
    setShowConfirm(false);
    setCheckingOut(true);
    setCreatingPayment(true);
    try {
      const data = await checkout.mutateAsync({
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        recipientAddress: recipientAddress.trim(),
        notes: notes.trim(),
        paymentMethodId: null,
      });
      const orderId = data.order?.id || data.id;
      setPendingOrderId(orderId);
      const session = await api.post("/stripe/create-checkout-session", { orderId });
      setClientSecret(session.clientSecret);
      setCreatingPayment(false);
    } catch (e) {
      toast("Error al crear el pedido: " + e.message, "error");
      setCreatingPayment(false);
      setCheckingOut(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (pendingOrderId) {
      try {
        await api.post(`/orders/${pendingOrderId}/confirm-payment`);
      } catch {}
    }
    setClientSecret(null);
    setPendingOrderId(null);
    setCheckingOut(false);
    clearCart();
    navigate("/perfil");
  };

  const handlePaymentCancel = () => {
    setClientSecret(null);
    setCheckingOut(false);
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
        {checkingOut ? "Procesando..." : "Proceder al Pago"}
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
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
      )}

      {creatingPayment && !clientSecret && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-[#ffffff] rounded-[18px] no-shadow w-full max-w-[420px] p-8 animate-fade-in text-center">
            <div className="w-8 h-8 border-4 border-[#e0e0e0] border-t-[#0066cc] rounded-full animate-spin mx-auto mb-4" />
            <p className="font-apple-body text-[17px] text-[#7a7a7a]">Preparando el pago...</p>
          </div>
        </div>
      )}

      {clientSecret && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handlePaymentCancel} />
          <div className="relative bg-[#ffffff] rounded-[18px] no-shadow w-full max-w-[420px] p-8 animate-fade-in">
            <h3 className="font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f] mb-2">
              Pagar con Tarjeta
            </h3>
            <p className="font-apple-body text-[15px] font-normal leading-[1.43] tracking-[-0.224px] text-[#7a7a7a] mb-6">
              Total: <strong className="text-[#1d1d1f]">{cartTotal.toLocaleString()} FCFA</strong>
            </p>
            {stripePromise ? (
              <CheckoutElementsProvider stripe={stripePromise} clientSecret={clientSecret}>
                <StripePaymentForm onSuccess={handlePaymentSuccess} onCancel={handlePaymentCancel} />
              </CheckoutElementsProvider>
            ) : (
              <p className="font-apple-body text-[17px] text-[#dc2626]">Error: Stripe no está configurado</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
