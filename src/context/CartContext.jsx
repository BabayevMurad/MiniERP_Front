import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useContext(AuthContext);
  const storageKey = useMemo(() => `cart:${user?.username ?? "guest"}`, [user?.username]);
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const addToCart = (product, qty, stock) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      const nextQty = Math.min(currentQty + qty, stock);
      if (existing) {
        return prev.map(i =>
          i.product_id === product.id ? { ...i, quantity: nextQty } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          quantity: Math.min(qty, stock),
          stock,
        },
      ];
    });
  };

  const setQty = (productId, qty) => {
    setItems(prev =>
      prev.map(i => {
        if (i.product_id !== productId) return i;
        const clamped = Math.min(Math.max(1, qty), i.stock ?? qty);
        return { ...i, quantity: clamped };
      })
    );
  };

  const removeFromCart = (productId) =>
    setItems(prev => prev.filter(i => i.product_id !== productId));

  const clearCart = () => setItems([]);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, setQty, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}
