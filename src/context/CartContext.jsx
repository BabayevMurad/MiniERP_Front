import { createContext, useEffect, useMemo, useState } from "react";

export const CartContext = createContext(null);

function toStrId(v) {
  return v == null ? "" : String(v);
}

export default function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem("cart");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed)
        ? parsed.map((it) => ({ ...it, id: toStrId(it.id ?? it.product_id) }))
        : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(items));
    } catch {}
  }, [items]);

  const addToCart = ({ product_id, name, price, stock = 9999 }) => {
    const sid = toStrId(product_id);
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === sid);
      if (idx === -1) {
        if ((Number(stock) || 0) <= 0) return prev;
        return [
          ...prev,
          {
            id: sid,
            product_id,
            name,
            price: Number(price) || 0,
            quantity: 1,
            stock: Number(stock) || 0,
          },
        ];
      } else {
        const next = [...prev];
        const cur = next[idx];
        const q = Math.min(cur.quantity + 1, cur.stock);
        if (q === cur.quantity) return prev;
        next[idx] = { ...cur, quantity: q };
        return next;
      }
    });
  };

  const updateQty = (product_id, quantity) => {
    const sid = toStrId(product_id);
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== sid) return it;
        const q = Math.max(1, Math.min(Number(quantity) || 1, it.stock));
        if (q === it.quantity) return it;
        return { ...it, quantity: q };
      })
    );
  };

  const inc = (product_id) => {
    const sid = toStrId(product_id);
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== sid) return it;
        const q = Math.min(it.quantity + 1, it.stock);
        if (q === it.quantity) return it;
        return { ...it, quantity: q };
      })
    );
  };

  const dec = (product_id) => {
    const sid = toStrId(product_id);
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== sid) return it;
        const q = Math.max(it.quantity - 1, 1);
        if (q === it.quantity) return it;
        return { ...it, quantity: q };
      })
    );
  };

  const removeItem = (product_id) => {
    const sid = toStrId(product_id);
    setItems((prev) => prev.filter((it) => it.id !== sid));
  };

  const clearCart = () => setItems([]);

  const total = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0),
    [items]
  );

  const value = { items, addToCart, updateQty, inc, dec, removeItem, clearCart, total };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
