import { Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="bg-white border border-gray-200 p-4 rounded-xl">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
          <p className="text-gray-600 text-sm mb-2">
            {item.price} FCFA/{item.unit}
          </p>
          <p className="font-bold text-lg">
            {(item.price * item.quantity).toLocaleString()} FCFA
          </p>
        </div>
        <button
          onClick={() => removeFromCart(item.id)}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="p-2 hover:bg-gray-200 rounded-l-lg transition-colors"
          >
            <Minus size={18} />
          </button>
          <span className="w-12 text-center font-semibold">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="p-2 hover:bg-gray-200 rounded-r-lg transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
