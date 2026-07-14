import { useState } from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();
  const [busy, setBusy] = useState(false);
  const product = item.product || item;
  const productId = item.productId || item.id;
  const lineTotal = (product.price * item.quantity).toLocaleString();

  const run = async (action) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f] mb-1">
            {product.name}
          </h3>
          <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a] mb-2">
            {product.price} FCFA/{product.unit}
          </p>
          <p className="font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f]">
            {lineTotal} FCFA
          </p>
        </div>
        <button
          onClick={() => run(() => removeFromCart(productId))}
          disabled={busy}
          className="p-2 text-[#0066cc] hover:bg-[#f5f5f7] rounded-[8px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <div className={`flex items-center gap-2 bg-[#f5f5f7] rounded-[8px] ${busy ? "opacity-60" : ""}`}>
          <button
            onClick={() => run(() => updateQuantity(productId, item.quantity - 1))}
            disabled={busy}
            className="p-2 hover:bg-[#e0e0e0] rounded-l-[8px] transition-colors btn-apple-active disabled:cursor-not-allowed"
          >
            <Minus size={18} />
          </button>
          <span className="w-12 text-center font-apple-body text-[17px] font-semibold leading-[1.24] tracking-[-0.374px] text-[#1d1d1f]">
            {item.quantity}
          </span>
          <button
            onClick={() => run(() => updateQuantity(productId, item.quantity + 1))}
            disabled={busy}
            className="p-2 hover:bg-[#e0e0e0] rounded-r-[8px] transition-colors btn-apple-active disabled:cursor-not-allowed"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
