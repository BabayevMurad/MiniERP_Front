import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { createOrder } from "../api/orders";

export default function Cart() {
  const { items, inc, dec, updateQty, removeItem, clearCart, total } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const placeOrder = async () => {
    try {
      setLoading(true);
      setErr(""); setMsg("");
      if (!items.length) throw new Error("Cart boşdur");
      const payload = items.map(it => ({ product_id: it.product_id, quantity: it.quantity }));
      const res = await createOrder(user.token, payload);
      setMsg(`Order #${res.id} yaradıldı. Status: ${res.status}`);
      clearCart();
    } catch (e) {
      setErr(e.message || "Order yaratmaq alınmadı");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Cart</h1>

      {err && <div className="p-3 rounded bg-red-100 text-red-700">{err}</div>}
      {msg && <div className="p-3 rounded bg-green-100 text-green-700">{msg}</div>}

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Product</th>
              <th className="text-left p-2">Price</th>
              <th className="text-left p-2">Stock</th>
              <th className="text-left p-2">Qty</th>
              <th className="text-left p-2">Line total</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!items.length && <tr><td className="p-4" colSpan={6}>Cart boşdur</td></tr>}
            {items.map(it => (
              <tr key={it.product_id} className="border-t">
                <td className="p-2">{it.name}</td>
                <td className="p-2">{it.price}</td>
                <td className="p-2">{it.stock}</td>
                <td className="p-2">
                  <div className="inline-flex items-center border rounded">
                    <button className="px-2" onClick={() => dec(it.product_id)}>-</button>
                    <input
                      type="number"
                      min={1}
                      max={it.stock}
                      className="w-16 text-center outline-none"
                      value={it.quantity}
                      onChange={(e) => updateQty(it.product_id, e.target.value)}
                    />
                    <button
                      className="px-2"
                      onClick={() => inc(it.product_id)}
                      disabled={it.quantity >= it.stock}
                      title={it.quantity >= it.stock ? "Max stock" : "Increase"}
                    >+</button>
                  </div>
                </td>
                <td className="p-2">{(Number(it.price) * Number(it.quantity)).toFixed(2)}</td>
                <td className="p-2">
                  <button
                    onClick={() => removeItem(it.product_id)}
                    className="px-3 py-1 rounded bg-red-600 text-white"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {!!items.length && (
              <tr className="border-t bg-gray-50">
                <td className="p-2 font-semibold" colSpan={4}>Total</td>
                <td className="p-2 font-semibold">{total.toFixed(2)}</td>
                <td className="p-2"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={clearCart}
          className="px-4 py-2 rounded bg-gray-200"
          disabled={!items.length}
        >
          Clear cart
        </button>
        <button
          onClick={placeOrder}
          className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60"
          disabled={!items.length || loading}
        >
          {loading ? "Placing..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}
