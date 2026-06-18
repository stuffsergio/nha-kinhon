import { useCart } from "../context/CartContext";

export default function CartSummary({ cartTotal }) {
  const { cart, clearCart } = useCart();

  const handleCheckout = () => {
    alert("Funcionalidad de checkout próximamente disponible");
  };

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-xl space-y-4">
      <h2 className="text-xl font-bold">Resumen del Pedido</h2>
      
      <div className="space-y-2">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{cartTotal.toLocaleString()} FCFA</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Envío</span>
          <span>Gratis</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>{cartTotal.toLocaleString()} FCFA</span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={cart.length === 0}
        className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Proceder al Pago
      </button>

      {cart.length > 0 && (
        <button
          onClick={clearCart}
          className="w-full text-red-500 py-2 rounded-xl font-medium hover:bg-red-50 transition-colors"
        >
          Vaciar Carrito
        </button>
      )}
    </div>
  );
}
