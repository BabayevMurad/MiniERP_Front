import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  exportProducts,
  importProducts,
} from "../api/products";

export default function Products() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";
  const { addToCart } = useContext(CartContext);

  const [products, setProducts] = useState([]);
  const [sort, setSort] = useState("price_asc");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [openNew, setOpenNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", slug: "", price: "", qty_in_stock: "" });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "", price: "", qty_in_stock: "" });

  const [importUpsert, setImportUpsert] = useState(true);
  const fileInputId = "excel-file-input";

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const data = await listProducts(user.token, { sort });
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Products yüklənmədi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [sort]);

  const sortedInfo = useMemo(() => {
    switch (sort) {
      case "price_asc": return "Price ↑";
      case "price_desc": return "Price ↓";
      case "name_asc": return "Name A→Z";
      case "name_desc": return "Name Z→A";
      default: return "Default";
    }
  }, [sort]);

  const handleCreate = async () => {
    try {
      const payload = {
        name: newForm.name.trim(),
        slug: newForm.slug.trim(),
        price: Number(newForm.price),
        qty_in_stock: Number(newForm.qty_in_stock),
      };
      if (!payload.name || !payload.slug) throw new Error("Name və slug tələb olunur");
      await createProduct(user.token, payload);
      setOpenNew(false);
      setNewForm({ name: "", slug: "", price: "", qty_in_stock: "" });
      setMsg("Product yaradıldı");
      await load();
    } catch (e) {
      setErr(e.message || "Create failed");
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      slug: p.slug,
      price: p.price,
      qty_in_stock: p.qty_in_stock,
    });
  };

  const saveEdit = async () => {
    try {
      const payload = {
        name: editForm.name.trim(),
        slug: editForm.slug.trim(),
        price: Number(editForm.price),
        qty_in_stock: Number(editForm.qty_in_stock),
      };
      await updateProduct(user.token, editingId, payload);
      setEditingId(null);
      setMsg("Yeniləndi");
      await load();
    } catch (e) {
      setErr(e.message || "Update failed");
    }
  };

  const remove = async (id) => {
    if (!confirm("Silinsin?")) return;
    try {
      await deleteProduct(user.token, id);
      setMsg("Silindi");
      await load();
    } catch (e) {
      setErr(e.message || "Delete failed");
    }
  };

  const doExport = async () => {
    try {
      setErr(""); setMsg("");
      await exportProducts(user.token);
      setMsg("Export hazırlandı (products_export.xlsx endirildi)");
    } catch (e) {
      setErr(e.message || "Export failed");
    }
  };

  const onPickFile = () => {
    const input = document.getElementById(fileInputId);
    if (input) input.click();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setErr(""); setMsg("");
      const res = await importProducts(user.token, file, importUpsert);
      setMsg(`${res.detail}. created=${res.created}, updated=${res.updated}, skipped=${res.skipped}`);
      if (res.errors?.length) {
        console.warn("Import errors:", res.errors);
      }
      await load();
    } catch (e2) {
      setErr(e2.message || "Import failed");
    }
  };

  const [qtyById, setQtyById] = useState({});
  const setQty = (id, v, max) => {
    const n = Math.max(1, Math.min(max ?? 9999, Number(v) || 1));
    setQtyById((s) => ({ ...s, [id]: n }));
  };

  const addToCartWithMsg = (p) => {
    const q = qtyById[p.id] ?? 1;
    if (typeof p.qty_in_stock === "number" && q > p.qty_in_stock) {
      setErr(`Stok kifayət etmir: ${p.name} (in stock: ${p.qty_in_stock})`);
      return;
    }
    addToCart({
      product_id: p.id,
      name: p.name,
      price: p.price,
      quantity: q,
      stock: p.qty_in_stock,
    });
    setMsg(`"${p.name}" cart-a əlavə olundu`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <div className="text-sm opacity-70">Sort: <b>{sortedInfo}</b></div>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="border rounded px-3 py-2"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="name_asc">Name A→Z</option>
            <option value="name_desc">Name Z→A</option>
          </select>

          {isAdmin && (
            <>
              <button
                onClick={() => setOpenNew(true)}
                className="px-3 py-2 rounded bg-green-600 text-white"
              >
                + New
              </button>

              <button
                onClick={doExport}
                className="px-3 py-2 rounded bg-indigo-600 text-white"
                title="Excel export"
              >
                Export
              </button>

              <input
                id={fileInputId}
                type="file"
                accept=".xlsx"
                onChange={onFileChange}
                className="hidden"
              />
              <button
                onClick={onPickFile}
                className="px-3 py-2 rounded bg-sky-600 text-white"
                title="Excel import (.xlsx)"
              >
                Import
              </button>

              <label className="text-sm flex items-center gap-2 ml-2">
                <input
                  type="checkbox"
                  checked={importUpsert}
                  onChange={e => setImportUpsert(e.target.checked)}
                />
                Upsert (slug üzrə yenilə)
              </label>
            </>
          )}
        </div>
      </div>

      {err && <div className="p-3 rounded bg-red-100 text-red-700">{err}</div>}
      {msg && <div className="p-3 rounded bg-green-100 text-green-700">{msg}</div>}

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Slug</th>
              <th className="text-left p-2">Price</th>
              <th className="text-left p-2">Stock</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4" colSpan={5}>Loading...</td></tr>}
            {!loading && products.length === 0 && <tr><td className="p-4" colSpan={5}>Boşdur</td></tr>}
            {!loading && products.map(p => {
              const q = qtyById[p.id] ?? 1;
              const max = typeof p.qty_in_stock === "number" ? p.qty_in_stock : 9999;
              const editing = editingId === p.id;

              return (
                <tr key={p.id} className="border-t">
                  <td className="p-2">
                    {editing ? (
                      <input
                        className="border rounded px-2 py-1 w-full"
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      />
                    ) : p.name}
                  </td>
                  <td className="p-2">
                    {editing ? (
                      <input
                        className="border rounded px-2 py-1 w-full"
                        value={editForm.slug}
                        onChange={e => setEditForm(f => ({ ...f, slug: e.target.value }))}
                      />
                    ) : p.slug}
                  </td>
                  <td className="p-2">
                    {editing ? (
                      <input
                        type="number"
                        className="border rounded px-2 py-1 w-28"
                        value={editForm.price}
                        onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                      />
                    ) : p.price}
                  </td>
                  <td className="p-2">
                    {editing ? (
                      <input
                        type="number"
                        className="border rounded px-2 py-1 w-24"
                        value={editForm.qty_in_stock}
                        onChange={e => setEditForm(f => ({ ...f, qty_in_stock: e.target.value }))}
                      />
                    ) : p.qty_in_stock}
                  </td>
                  <td className="p-2">
                    {isAdmin ? (
                      <div className="flex items-center gap-2">
                        {!editing ? (
                          <>
                            <button
                              onClick={() => startEdit(p)}
                              className="px-3 py-1 rounded bg-gray-800 text-white"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => remove(p.id)}
                              className="px-3 py-1 rounded bg-red-600 text-white"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={saveEdit}
                              className="px-3 py-1 rounded bg-blue-600 text-white"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 rounded bg-gray-200"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center border rounded">
                          <button className="px-2" onClick={() => setQty(p.id, Math.max(1, q - 1), max)}>-</button>
                          <input
                            type="number"
                            min={1}
                            max={max}
                            className="w-16 text-center outline-none"
                            value={q}
                            onChange={e => setQty(p.id, e.target.value, max)}
                          />
                          <button
                            className="px-2"
                            onClick={() => setQty(p.id, Math.min(max, q + 1), max)}
                            disabled={q >= max}
                            title={q >= max ? "Max stock" : "Increase"}
                          >+</button>
                        </div>
                        <button
                          onClick={() => addToCartWithMsg(p)}
                          className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-60"
                          disabled={max <= 0}
                          title={max <= 0 ? "Out of stock" : "Add to cart"}
                        >
                          Add to cart
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isAdmin && openNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg w-full max-w-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Yeni Product</h3>
              <button onClick={() => setOpenNew(false)} className="text-gray-500 hover:text-black">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={newForm.name}
                  onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Slug</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={newForm.slug}
                  onChange={e => setNewForm(f => ({ ...f, slug: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Price</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={newForm.price}
                    onChange={e => setNewForm(f => ({ ...f, price: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Qty in stock</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={newForm.qty_in_stock}
                    onChange={e => setNewForm(f => ({ ...f, qty_in_stock: e.target.value }))}
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button onClick={() => setOpenNew(false)} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
                <button onClick={handleCreate} className="px-4 py-2 rounded bg-green-600 text-white">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
