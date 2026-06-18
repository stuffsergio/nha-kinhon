import { useCart } from "../context/CartContext";
import CartItem from "./CartItem";

export default function CartList() {
  const { cart } = useCart();

  return (
    <div className="space-y-4">
      {cart.map((item) => (
        <CartItem key={item.id} item={item} />
      ))}
    </div>
  );
}
