import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { createOrder, listOrders, payOrder, getOrder, adminUpdateOrderStatus } from "../api/orders";

function decodeJwtSub(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.sub ? Number(payload.sub) : null;
  } catch {
    return null;
  }
}

function StatusBadge({ status }) {
  const map = {
    NEW: "bg-yellow-100 text-yellow-800",
    PAID: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-green-100 text-green-800",
    CANCELED: "bg-red-100 text-red-800",
  };
  const cls = map[status] || "bg-gray-100 text-gray-800";
  return <span className={`px-2 py-1 text-xs rounded ${cls}`}>{status}</span>;
}

const ADMIN_ALLOWED = {
  NEW: ["NEW", "PAID", "CANCELED"],
  PAID: ["PAID", "SHIPPED", "CANCELED"],
  SHIPPED: ["SHIPPED"],
  CANCELED: ["CANCELED"],
};

export default function Orders() {
  const { user } = useContext(AuthContext);
  const { items: cartItems, setQty, removeFromCart, clearCart, total } = useContext(CartContext);

  const isAdmin = user?.role === "admin";
  const currentUserId = useMemo(() => decodeJwtSub(user?.token), [user?.token]);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [placing, setPlacing] = useState(false);
  const [payingId, setPayingId] = useState(null);

  // detail modal
  const [openDetail, setOpenDetail] = useState(false);
  const [detail, setDetail] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [editStatus, setEditStatus] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const data = await listOrders(user.token);
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Orders yüklənə bilmədi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const visibleOrders = useMemo(() => {
    if (isAdmin) return orders;
    if (!currentUserId) return [];
    return orders.filter(o => o.user_id === currentUserId);
  }, [orders, isAdmin, currentUserId]);

  const placeOrder = async () => {
    if (cartItems.length === 0) {
      alert("Cart boşdur");
      return;
    }
    const itemsPayload = cartItems.map(i => ({
      product_id: i.product_id,
      quantity: i.quantity,
    }));
    try {
      setPlacing(true);
      setErr("");
      await createOrder(user.token, itemsPayload);
      clearCart();
      await load();
    } catch (e) {
      setErr(e.message || "Order yaratmaq alınmadı");
    } finally {
      setPlacing(false);
    }
  };

  const pay = async (id) => {
    try {
      setPayingId(id);
      setErr("");
      await payOrder(user.token, id);
      await load();
    } catch (e) {
      setErr(e.message || "Ödəniş alınmadı");
    } finally {
      setPayingId(null);
    }
  };

  const openOrderDetail = async (id) => {
    try {
      setErr("");
      const d = await getOrder(user.token, id);
      setDetail(d);
      setEditStatus(d.status);
      setOpenDetail(true);
    } catch (e) {
      setErr(e.message || "Order detalları alınmadı");
    }
  };

  const saveAdminStatus = async () => {
    if (!detail) return;
    if (editStatus === detail.status) {
      setOpenDetail(false);
      return;
    }
    try {
      setSavingStatus(true);
      await adminUpdateOrderStatus(user.token, detail.id, editStatus);
      await load();
      setOpenDetail(false);
    } catch (e) {
      setErr(e.message || "Status yenilənmədi");
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {!isAdmin && (
        <section className="bg-white rounded shadow p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Cart</h2>
            <div className="text-sm">
              Total: <span className="font-semibold">{total.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-3">
            {cartItems.length === 0 ? (
              <div className="opacity-70">Cart boşdur</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">Qty</th>
                      <th className="text-left p-2">Price</th>
                      <th className="text-left p-2">Line Total</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((ci) => (
                      <tr key={ci.product_id} className="border-t">
                        <td className="p-2">{ci.name}</td>
                        <td className="p-2">
                          <div className="inline-flex items-center border rounded">
                            <button className="px-2 py-1" onClick={() => setQty(ci.product_id, Math.max(1, ci.quantity - 1))}>-</button>
                            <input
                              type="number"
                              className="w-16 text-center outline-none"
                              min={1}
                              max={ci.stock ?? 9999}
                              value={ci.quantity}
                              onChange={e => setQty(ci.product_id, Number(e.target.value))}
                            />
                            <button
                              className="px-2 py-1"
                              onClick={() => setQty(ci.product_id, Math.min((ci.stock ?? 9999), ci.quantity + 1))}
                              disabled={ci.quantity >= (ci.stock ?? 9999)}
                              title={ci.quantity >= (ci.stock ?? 9999) ? "Max stock" : "Increase"}
                            >
                              +
                            </button>
                          </div>
                          {typeof ci.stock === "number" && (
                            <div className="text-xs opacity-60 mt-1">Stock: {ci.stock}</div>
                          )}
                        </td>
                        <td className="p-2">{ci.price}</td>
                        <td className="p-2">{(ci.price * ci.quantity).toFixed(2)}</td>
                        <td className="p-2">
                          <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => removeFromCart(ci.product_id)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={placeOrder}
                disabled={cartItems.length === 0 || placing}
                className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
              >
                {placing ? "Placing..." : "Place Order"}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="bg-white rounded shadow p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Orders</h2>
          <button onClick={load} className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">
            Refresh
          </button>
        </div>

        {err && <div className="mt-3 text-red-600">{err}</div>}

        <div className="mt-3 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">ID</th>
                {isAdmin && <th className="text-left p-2">User ID</th>}
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Total</th>
                <th className="text-left p-2">Created</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td className="p-3" colSpan={6}>Loading...</td></tr>}
              {!loading && visibleOrders.length === 0 && <tr><td className="p-3" colSpan={6}>Order tapılmadı</td></tr>}
              {!loading && visibleOrders.map(o => (
                <tr key={o.id} className="border-t">
                  <td className="p-2">#{o.id}</td>
                  {isAdmin && <td className="p-2">{o.user_id}</td>}
                  <td className="p-2"><StatusBadge status={o.status} /></td>
                  <td className="p-2">{o.total_amount?.toFixed ? o.total_amount.toFixed(2) : o.total_amount}</td>
                  <td className="p-2">{o.created_at ? new Date(o.created_at).toLocaleString() : "-"}</td>
                  <td className="p-2 flex items-center gap-2">
                    <button
                      onClick={() => openOrderDetail(o.id)}
                      className="px-3 py-1 rounded bg-gray-800 text-white"
                    >
                      Details
                    </button>
                    {!isAdmin && o.status === "NEW" && (
                      <button
                        onClick={() => pay(o.id)}
                        disabled={payingId === o.id}
                        className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-60"
                      >
                        {payingId === o.id ? "Paying..." : "Pay"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {openDetail && detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg w-full max-w-2xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Order #{detail.id}</h3>
              <button onClick={()=>setOpenDetail(false)} className="text-gray-500 hover:text-black">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div>User ID: <b>{detail.user_id}</b></div>
                <div>Status: <StatusBadge status={detail.status} /></div>
                <div>Total: <b>{detail.total_amount?.toFixed ? detail.total_amount.toFixed(2) : detail.total_amount}</b></div>
                <div>Created: {detail.created_at ? new Date(detail.created_at).toLocaleString() : "-"}</div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">Price</th>
                      <th className="text-left p-2">Qty</th>
                      <th className="text-left p-2">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items?.map(it => (
                      <tr key={it.id} className="border-t">
                        <td className="p-2">{it.product_name_snapshot}</td>
                        <td className="p-2">{it.product_price_snapshot}</td>
                        <td className="p-2">{it.quantity}</td>
                        <td className="p-2">{it.line_total?.toFixed ? it.line_total.toFixed(2) : it.line_total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {isAdmin && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm">Change status (admin):</label>
                    <select
                      className="border rounded px-3 py-2"
                      value={editStatus}
                      onChange={e=>setEditStatus(e.target.value)}
                    >
                      {ADMIN_ALLOWED[detail.status]?.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                      onClick={saveAdminStatus}
                      disabled={savingStatus}
                    >
                      {savingStatus ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
