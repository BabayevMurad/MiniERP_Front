const BASE = "http://127.0.0.1:8000";

export function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function listProducts(token, params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/products/${q ? "?" + q : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createProduct(token, payload) {
  const res = await fetch(`${BASE}/products/`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateProduct(token, id, payload) {
  const res = await fetch(`${BASE}/products/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteProduct(token, id) {
  const res = await fetch(`${BASE}/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
