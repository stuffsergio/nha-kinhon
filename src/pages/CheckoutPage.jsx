import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckoutElementsProvider, useCheckout, PaymentElement } from "@stripe/react-stripe-js/checkout";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, CreditCard } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { useCart } from "../context/CartContext";
import { api } from "../services/api";

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null;

function PaymentForm({ cartTotal, email, onCancel, onSuccess }) {
  const checkoutResult = useCheckout();
  const toast = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (checkoutResult.type !== "success") return;

    setProcessing(true);
    const { error } = await checkoutResult.checkout.confirm({ email });

    if (error) {
      toast(error.message || "Error al procesar el pago", "error");
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  if (checkoutResult.type === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#e0e0e0] border-t-[#0066cc] rounded-full animate-spin" />
      </div>
    );
  }

  if (checkoutResult.type === "error") {
    return (
      <div className="text-center py-12 bg-[#fef2f2] rounded-[18px]">
        <p className="font-apple-body text-[17px] text-[#dc2626] mb-4">
          {checkoutResult.error.message || "Error al cargar el pago"}
        </p>
        <button onClick={onCancel} className="text-[#0066cc] font-apple-body text-[15px] hover:underline">
          Volver al carrito
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#f5f5f7] rounded-[18px] p-6">
        <PaymentElement />
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 px-4 py-3 border border-[#e0e0e0] rounded-[9999px] font-apple-body text-[17px] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={processing}
          className="flex-1 px-4 py-3 bg-[#0066cc] text-white rounded-[9999px] font-apple-body text-[17px] hover:bg-[#0071e3] transition-colors disabled:bg-[#d2d2d7] disabled:cursor-not-allowed"
        >
          {processing ? "Procesando..." : `Pagar ${cartTotal.toLocaleString()} FCFA`}
        </button>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();

  const { clientSecret, orderId, cartTotal, userEmail } = location.state || {};

  if (!clientSecret || !orderId) {
    return (
      <div className="w-full max-w-[980px] mx-auto py-[80px] px-6 text-center">
        <h1 className="font-apple-display text-[40px] font-semibold text-[#1d1d1f] mb-4">Pago no disponible</h1>
        <p className="font-apple-body text-[17px] text-[#7a7a7a] mb-6">No hay información de pago. Vuelve al carrito.</p>
        <button onClick={() => navigate("/carrito")} className="px-5 py-3 bg-[#0066cc] text-white rounded-[9999px] font-apple-body text-[17px] hover:bg-[#0071e3] transition-colors">
          Volver al carrito
        </button>
      </div>
    );
  }

  const handleSuccess = async () => {
    // El carrito se vacía en backend vía webhook / confirm-payment;
    // aquí solo limpiamos UI tras pago exitoso en el cliente.
    await clearCart();
  };

  const handleCancel = async () => {
    try {
      await api.post(`/orders/${orderId}/cancel`);
    } catch {
      // Si ya estaba cancelado o el pago llegó entre medias, volver al carrito igual
    }
    navigate("/carrito", { replace: true });
  };

  return (
    <div className="w-full max-w-[540px] mx-auto py-[80px] px-6">
      <button onClick={handleCancel} className="inline-flex items-center gap-1.5 font-apple-body text-[15px] text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors mb-8">
        <ArrowLeft size={18} /> Volver al carrito
      </button>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#0066cc]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard size={32} className="text-[#0066cc]" />
        </div>
        <h1 className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f] mb-2">
          Pagar con Tarjeta
        </h1>
        <p className="font-apple-body text-[17px] text-[#7a7a7a]">
          Total a pagar: <strong className="text-[#1d1d1f]">{cartTotal?.toLocaleString() || "—"} FCFA</strong>
        </p>
      </div>

      {stripePromise ? (
        <CheckoutElementsProvider stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm cartTotal={cartTotal} email={userEmail} onCancel={handleCancel} onSuccess={handleSuccess} />
        </CheckoutElementsProvider>
      ) : (
        <div className="text-center py-12 bg-[#fef2f2] rounded-[18px]">
          <p className="font-apple-body text-[17px] text-[#dc2626]">El sistema de pago no está configurado.</p>
        </div>
      )}
    </div>
  );
}
