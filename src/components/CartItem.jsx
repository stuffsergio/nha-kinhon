import { Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f] mb-1">
            {item.name}
          </h3>
          <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a] mb-2">
            {item.price} FCFA/{item.unit}
          </p>
          <p className="font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f]">
            {(item.price * item.quantity).toLocaleString()} FCFA
          </p>
        </div>
        <button
          onClick={() => removeFromCart(item.id)}
          className="p-2 text-[#0066cc] hover:bg-[#f5f5f7] rounded-[8px] transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-2 bg-[#f5f5f7] rounded-[8px]">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="p-2 hover:bg-[#e0e0e0] rounded-l-[8px] transition-colors btn-apple-active"
          >
            <Minus size={18} />
          </button>
          <span className="w-12 text-center font-apple-body text-[17px] font-semibold leading-[1.24] tracking-[-0.374px] text-[#1d1d1f]">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="p-2 hover:bg-[#e0e0e0] rounded-r-[8px] transition-colors btn-apple-active"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
