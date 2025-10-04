const BASE = "http://127.0.0.1:8000";

function auth(token) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function parseMaybeJSON(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export async function listOrders(token) {
  const res = await fetch(`${BASE}/orders/`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const msg = await parseMaybeJSON(res);
    throw new Error(typeof msg === "string" ? msg : msg.detail || "Failed to list orders");
  }
  return res.json();
}

export async function getOrder(token, id) {
  const res = await fetch(`${BASE}/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const msg = await parseMaybeJSON(res);
    throw new Error(typeof msg === "string" ? msg : msg.detail || "Failed to get order");
  }
  return res.json();
}

export async function createOrder(token, items) {
  const res = await fetch(`${BASE}/orders/`, {
    method: "POST",
    headers: auth(token),
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const msg = await parseMaybeJSON(res);
    throw new Error(typeof msg === "string" ? msg : msg.detail || "Create order failed");
  }
  return res.json();
}

export async function payOrder(token, id) {
  const res = await fetch(`${BASE}/orders/${id}/pay`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const msg = await parseMaybeJSON(res);
    throw new Error(typeof msg === "string" ? msg : msg.detail || "Pay failed");
  }
  return res.json();
}

export async function adminUpdateOrderStatus(token, id, newStatus) {
  const res = await fetch(`${BASE}/orders/${id}/status`, {
    method: "PATCH",
    headers: auth(token),
    body: JSON.stringify({ new_status: newStatus }),
  });
  if (!res.ok) {
    const msg = await parseMaybeJSON(res);
    throw new Error(typeof msg === "string" ? msg : msg.detail || "Update status failed");
  }
  return res.json();
}
