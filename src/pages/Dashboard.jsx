import React, { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { listProducts } from "../api/products";
import { listOrders } from "../api/orders";

function decodeJwtSub(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const id = payload?.sub;
    return id == null ? null : Number(id);
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

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const token =
    user?.token || (typeof window !== "undefined" ? localStorage.getItem("token") : "");

  const isAdmin = user?.role === "admin";
  const currentUserId = useMemo(() => decodeJwtSub(token || ""), [token]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const load = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setErr("");
      const p = await listProducts(token, { sort: "price_asc" });
      setProducts(Array.isArray(p) ? p : []);
      const o = await listOrders(token);
      setOrders(Array.isArray(o) ? o : []);
    } catch (e) {
      setErr(e.message || "Dashboard yüklənmədi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const visibleOrders = useMemo(() => {
    if (isAdmin) return orders;
    if (!currentUserId) return [];
    return orders.filter((o) => o.user_id === currentUserId);
  }, [orders, isAdmin, currentUserId]);

  const stats = useMemo(() => {
    const totalProducts = products.length;

    const totalOrders = visibleOrders.length;
    const newCount = visibleOrders.filter((o) => o.status === "NEW").length;
    const paidCount = visibleOrders.filter((o) => o.status === "PAID").length;

    const revenue = visibleOrders.reduce((sum, o) => {
      const v =
        typeof o.total_amount === "number"
          ? o.total_amount
          : Number(o.total_amount) || 0;
      return sum + v;
    }, 0);

    return { totalProducts, totalOrders, newCount, paidCount, revenue };
  }, [products, visibleOrders]);

  const recent = useMemo(() => {
    const cloned = [...visibleOrders];
    cloned.sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    });
    return cloned.slice(0, 5);
  }, [visibleOrders]);

  if (!token) {
    return <div className="p-6">Zəhmət olmasa, <b>login</b> olun.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Xoş gəlmisən, {user?.username || "istifadəçi"} 👋
        </h1>
        <span className="text-sm text-gray-500">
          Rol: <b>{user?.role?.toUpperCase()}</b>
        </span>
      </div>

      {err && <div className="p-3 rounded bg-red-100 text-red-700">{err}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm">Məhsullar</h3>
            <p className="text-3xl font-bold mt-1">{stats.totalProducts}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            P
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm">Sifarişlər</h3>
            <p className="text-3xl font-bold mt-1">{stats.totalOrders}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
            O
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm">NEW / PAID</h3>
          <p className="text-3xl font-bold mt-1">
              {stats.newCount} / {stats.paidCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">
            S
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm">Gəlir (toplam)</h3>
            <p className="text-3xl font-bold mt-1">
              {Number(stats.revenue || 0).toFixed(2)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
            ₼
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Son sifarişlər</h2>
          <button
            onClick={load}
            className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
            disabled={loading}
          >
            {loading ? "Yüklənir..." : "Yenilə"}
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">ID</th>
              {isAdmin && <th className="text-left p-2">User ID</th>}
              <th className="text-left p-2">Məbləğ</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Tarix</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr>
                <td className="p-4" colSpan={isAdmin ? 5 : 4}>
                  Heç bir sifariş yoxdur
                </td>
              </tr>
            )}
            {recent.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-2">#{o.id}</td>
                {isAdmin && <td className="p-2">{o.user_id}</td>}
                <td className="p-2">
                  {o.total_amount?.toFixed
                    ? o.total_amount.toFixed(2)
                    : o.total_amount}
                </td>
                <td className="p-2">
                  <StatusBadge status={o.status} />
                </td>
                <td className="p-2">
                  {o.created_at
                    ? new Date(o.created_at).toLocaleString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
