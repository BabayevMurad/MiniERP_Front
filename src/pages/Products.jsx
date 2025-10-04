import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { createProduct, deleteProduct, listProducts, updateProduct } from "../api/products";
import Toast from "../components/Toast";

export default function Products() {
  const { user } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");

  const emptyForm = { id: null, name: "", slug: "", price: "", qty_in_stock: "" };
  const [form, setForm] = useState(emptyForm);
  const isAdmin = user?.role === "admin";

  const [tOpen, setTOpen] = useState(false);
  const [tText, setTText] = useState("");
  const openToast = (txt) => { setTText(txt); setTOpen(true); };

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const data = await listProducts(user.token);
      setItems(data || []);
    } catch (e) {
      setErr("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load();}, []);

  const filtered = useMemo(() => {
    let arr = items.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
    );
    switch (sortBy) {
      case "name_asc":   arr.sort((a,b)=>a.name.localeCompare(b.name)); break;
      case "name_desc":  arr.sort((a,b)=>b.name.localeCompare(a.name)); break;
      case "price_asc":  arr.sort((a,b)=>a.price - b.price); break;
      case "price_desc": arr.sort((a,b)=>b.price - a.price); break;
      default: break;
    }
    return arr;
  }, [items, search, sortBy]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        price: parseFloat(form.price),
        qty_in_stock: parseInt(form.qty_in_stock, 10),
      };
      if (!payload.name || !payload.slug || isNaN(payload.price) || isNaN(payload.qty_in_stock)) {
        setErr("Fill the form correctly"); return;
      }
      if (form.id) {
        await updateProduct(user.token, form.id, payload);
        openToast("Product updated");
      } else {
        await createProduct(user.token, payload);
        openToast("Product added");
      }
      setForm(emptyForm);
      await load();
    } catch (e) {
      setErr("Save failed (slug unique ola bilər)");
    }
  };

  const onEdit = (p) => setForm({
    id: p.id, name: p.name, slug: p.slug, price: String(p.price), qty_in_stock: String(p.qty_in_stock),
  });

  const onDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(user.token, id);
      openToast("Product deleted");
      await load();
    } catch {
      setErr("Delete failed");
    }
  };

  const handleAddToCart = (p, qty) => {
    addToCart(p, qty, p.qty_in_stock);
    openToast(`"${p.name}" səbətə əlavə olundu`);
  };

  return (
    <div className="p-6">
      <Toast show={tOpen} text={tText} onClose={() => setTOpen(false)} />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="Search name/slug..."
            className="border rounded px-3 py-2"
          />
          <select className="border rounded px-3 py-2" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            <option value="name_asc">Name ↑</option>
            <option value="name_desc">Name ↓</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </select>
        </div>
      </div>

      {err && <div className="mb-3 text-red-600">{err}</div>}

      {isAdmin && (
        <form onSubmit={onSubmit} className="bg-white rounded shadow p-4 mb-6 grid grid-cols-5 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Name"
                 value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))}/>
          <input className="border rounded px-3 py-2" placeholder="Slug"
                 value={form.slug} onChange={e=>setForm(f=>({...f, slug: e.target.value}))}/>
          <input className="border rounded px-3 py-2" placeholder="Price" type="number" step="0.01"
                 value={form.price} onChange={e=>setForm(f=>({...f, price: e.target.value}))}/>
          <input className="border rounded px-3 py-2" placeholder="Qty in stock" type="number"
                 value={form.qty_in_stock} onChange={e=>setForm(f=>({...f, qty_in_stock: e.target.value}))}/>
          <div className="flex gap-2">
            <button className="bg-green-600 text-white rounded px-4" type="submit">
              {form.id ? "Update" : "Add"}
            </button>
            {form.id && (
              <button type="button" onClick={()=>setForm(emptyForm)} className="bg-gray-300 rounded px-4">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Slug</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Stock</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="p-4">Loading...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={5} className="p-4">No products</td></tr>}
            {!loading && filtered.map(p => (
              <Row
                key={p.id}
                p={p}
                isAdmin={isAdmin}
                onEdit={()=>onEdit(p)}
                onDelete={()=>onDelete(p.id)}
                onAddToCart={(qty)=>handleAddToCart(p, qty)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ p, isAdmin, onEdit, onDelete, onAddToCart }) {
  const [qty, setQty] = useState(1);
  useEffect(() => setQty(1), [p.id]);

  return (
    <tr className="border-t">
      <td className="p-3">{p.name}</td>
      <td className="p-3 opacity-70">{p.slug}</td>
      <td className="p-3">{p.price}</td>
      <td className="p-3">{p.qty_in_stock}</td>
      <td className="p-3">
        {isAdmin ? (
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={onEdit}>Edit</button>
            <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={onDelete}>Delete</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={p.qty_in_stock}
              value={qty}
              onChange={e=>setQty(Math.min(Math.max(1, Number(e.target.value)), p.qty_in_stock))}
              className="w-20 border rounded px-2 py-1"
            />
            <button
              className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-60"
              onClick={()=>onAddToCart(qty)}
              disabled={p.qty_in_stock <= 0}
              title={p.qty_in_stock <= 0 ? "Out of stock" : "Add to cart"}
            >
              Add to cart
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
