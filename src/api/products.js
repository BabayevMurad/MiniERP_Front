const BASE = "http://127.0.0.1:8000";

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function parseMaybeJSON(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export async function listProducts(token, { sort } = {}) {
  const url = new URL(`${BASE}/products/`);
  if (sort) url.searchParams.set("sort", sort);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error((await parseMaybeJSON(res)).detail || "Load products failed");
  return res.json();
}

export async function createProduct(token, payload) {
  const res = await fetch(`${BASE}/products/`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseMaybeJSON(res);
  if (!res.ok) throw new Error(data.detail || "Create product failed");
  return data;
}

export async function updateProduct(token, id, payload) {
  const res = await fetch(`${BASE}/products/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseMaybeJSON(res);
  if (!res.ok) throw new Error(data.detail || "Update product failed");
  return data;
}

export async function deleteProduct(token, id) {
  const res = await fetch(`${BASE}/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseMaybeJSON(res);
  if (!res.ok) throw new Error(data.detail || "Delete failed");
  return data;
}

export async function exportProducts(token) {
  const res = await fetch(`${BASE}/products/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const msg = await parseMaybeJSON(res);
    throw new Error(typeof msg === "string" ? msg : msg.detail || "Export failed");
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products_export.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function importProducts(token, file, upsert = true) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/products/import?upsert=${upsert ? "true" : "false"}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await parseMaybeJSON(res);
  if (!res.ok) throw new Error(typeof data === "string" ? data : data.detail || "Import failed");
  return data;
}
