const BASE = "http://127.0.0.1:8000";

async function parseMaybeJSON(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

function getToken(tMaybe) {
  const t = tMaybe || (typeof window !== "undefined" ? localStorage.getItem("token") : "");
  return t || "";
}
function authHeaders(tMaybe, extra = {}) {
  const t = getToken(tMaybe);
  if (!t) throw new Error("Auth token yoxdur (login olunmayıb?)");
  return { ...extra, Authorization: `Bearer ${t}` };
}

export async function listOrders(token) {
  const res = await fetch(`${BASE}/orders/`, { headers: authHeaders(token) });
  const data = await parseMaybeJSON(res);
  if (!res.ok) throw new Error(typeof data === "string" ? data : data.detail || "Orders yüklənmədi");
  return data;
}

export async function getOrder(token, id) {
  const res = await fetch(`${BASE}/orders/${id}`, { headers: authHeaders(token) });
  const data = await parseMaybeJSON(res);
  if (!res.ok) throw new Error(typeof data === "string" ? data : data.detail || "Order tapılmadı");
  return data;
}

export async function createOrder(token, cartItems) {
  const payload = {
    items: cartItems.map(it => ({ product_id: Number(it.product_id), quantity: Number(it.quantity) })),
  };
  const res = await fetch(`${BASE}/orders/`, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const data = await parseMaybeJSON(res);
  if (!res.ok) throw new Error(typeof data === "string" ? data : data.detail || "Order yaratmaq alınmadı");
  return data;
}

export async function payOrder(token, id) {
  const res = await fetch(`${BASE}/orders/${id}/pay`, { method: "POST", headers: authHeaders(token) });
  const data = await parseMaybeJSON(res);
  if (!res.ok) throw new Error(typeof data === "string" ? data : data.detail || "Ödəniş alınmadı");
  return data;
}

export async function adminUpdateOrderStatus(token, id, newStatus) {
  const res = await fetch(`${BASE}/orders/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ new_status: newStatus }),
  });
  const data = await parseMaybeJSON(res);
  if (!res.ok) throw new Error(typeof data === "string" ? data : data.detail || "Status yenilənmədi");
  return data;
}
