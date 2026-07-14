import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Esperar a que la sesión se resuelva antes de decidir el estado del carrito.
    if (authLoading) return;
    if (user) {
      setLoading(true);
      api
        .get("/cart")
        .then((data) => setCart(data.items || []))
        .catch(() => setCart([]))
        .finally(() => setLoading(false));
    } else {
      setCart([]);
      setLoading(false);
    }
  }, [user, authLoading]);

  const addToCart = useCallback(async (product) => {
    if (!user) throw new Error("Debes iniciar sesión para agregar productos al carrito");
    const data = await api.post("/cart/items", {
      productId: product.id,
      quantity: 1,
    });
    setCart((prev) => {
      const exists = prev.find((i) => i.productId === data.item.productId);
      if (exists) {
        return prev.map((i) =>
          i.id === data.item.id ? { ...i, quantity: data.item.quantity } : i
        );
      }
      return [...prev, data.item];
    });
    return data.item;
  }, [user]);

  const removeFromCart = useCallback(async (productId) => {
    if (!user) return;
    try {
      const item = cart.find((i) => i.productId === productId || i.id === productId);
      if (item) await api.del(`/cart/items/${item.id}`);
      setCart((prev) => prev.filter((i) => i.productId !== productId && i.id !== productId));
    } catch (e) {
      console.error("Error al eliminar del carrito:", e);
    }
  }, [user, cart]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    if (!user) return;
    try {
      const item = cart.find((i) => i.productId === productId || i.id === productId);
      if (!item) return;

      if (quantity <= 0) {
        await api.del(`/cart/items/${item.id}`);
        setCart((prev) => prev.filter((i) => i.id !== item.id));
        return;
      }

      const data = await api.put(`/cart/items/${item.id}`, { quantity });
      setCart((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, quantity: data.item?.quantity ?? quantity } : i))
      );
    } catch (e) {
      console.error("Error al actualizar cantidad:", e);
    }
  }, [user, cart]);

  const clearCart = useCallback(async () => {
    if (!user) return;
    try {
      await api.del("/cart");
      setCart([]);
    } catch (e) {
      console.error("Error al vaciar carrito:", e);
    }
  }, [user]);

  const cartTotal = cart.reduce(
    (total, item) => total + (item.product?.price || item.price || 0) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }
  return context;
}
