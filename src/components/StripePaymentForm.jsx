import { useState } from "react";
import { PaymentElement, useCheckout } from "@stripe/react-stripe-js/checkout";
import { useToast } from "../context/ToastContext";

export default function StripePaymentForm({ onSuccess, onCancel }) {
  const checkout = useCheckout();
  const toast = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!checkout) return;

    setProcessing(true);

    const loadResult = await checkout.loadActions();
    if (loadResult.error) {
      toast(loadResult.error.message || "Error al cargar el pago", "error");
      setProcessing(false);
      return;
    }

    const { error } = await checkout.confirm();

    if (error) {
      toast(error.message || "Error al procesar el pago", "error");
      setProcessing(false);
    } else {
      toast("Pago realizado con éxito", "success");
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 px-4 py-3 border border-[#e0e0e0] rounded-[9999px] font-apple-body text-[17px] font-normal leading-[1.47] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!checkout || processing}
          className="flex-1 px-4 py-3 bg-[#0066cc] text-white rounded-[9999px] font-apple-body text-[17px] font-normal leading-[1.47] hover:bg-[#0071e3] transition-colors disabled:bg-[#d2d2d7] disabled:cursor-not-allowed"
        >
          {processing ? "Procesando..." : "Pagar"}
        </button>
      </div>
    </form>
  );
}
