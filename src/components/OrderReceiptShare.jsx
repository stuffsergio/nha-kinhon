import { Share2, Copy } from "lucide-react";
import { useState } from "react";
import { useOrderReceipt } from "../hooks/useOrderReceipt";
import { useToast } from "../context/ToastContext";

export default function OrderReceiptShare({ orderId }) {
  const { data, isLoading, isError } = useOrderReceipt(orderId);
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const shareText = data?.shareText;

  const handleCopy = async () => {
    if (!shareText) return;
    setBusy(true);
    try {
      await navigator.clipboard.writeText(shareText);
      toast("Recibo copiado al portapapeles", "success");
    } catch {
      toast("No se pudo copiar el recibo", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    if (!shareText) return;
    setBusy(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Recibo Nha Kinhon",
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast("Recibo copiado (compartir no disponible en este navegador)", "success");
      }
    } catch (e) {
      if (e?.name !== "AbortError") {
        toast("No se pudo compartir el recibo", "error");
      }
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || isError || !shareText) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleShare}
        disabled={busy}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066cc] text-white rounded-[9999px] font-apple-body text-[14px] hover:bg-[#0071e3] disabled:opacity-50 transition-colors"
      >
        <Share2 size={16} />
        Compartir recibo
      </button>
      <button
        type="button"
        onClick={handleCopy}
        disabled={busy}
        className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] rounded-[9999px] font-apple-body text-[14px] text-[#1d1d1f] hover:bg-[#f5f5f7] disabled:opacity-50 transition-colors"
      >
        <Copy size={16} />
        Copiar texto
      </button>
    </div>
  );
}
