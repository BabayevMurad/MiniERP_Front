import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const isActive = (path) =>
    location.pathname.startsWith(path)
      ? "bg-green-600/60"
      : "hover:bg-green-600/40";

  return (
    <aside className="w-64 min-h-screen bg-green-800 text-white flex flex-col">
      <div className="px-5 py-6 border-b border-white/10">
        <h1 className="text-2xl font-bold tracking-wide">Mini ERP</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link to="/dashboard" className={`block px-3 py-2 rounded ${isActive("/dashboard")}`}>🏠 Dashboard</Link>
        <Link to="/products" className={`block px-3 py-2 rounded ${isActive("/products")}`}>📦 Products</Link>
        <Link to="/orders" className={`block px-3 py-2 rounded ${isActive("/orders")}`}>🛒 Orders</Link>
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="text-sm mb-3">
          <span className="opacity-80">Role:&nbsp;</span>
          <span className="inline-block px-2 py-0.5 rounded bg-white/10">
            {user?.role ?? "unknown"}
          </span>
        </div>
        <button
          onClick={logout}
          className="w-full bg-red-500 hover:bg-red-600 text-white rounded px-3 py-2">
          Logout
        </button>
      </div>
    </aside>
  );
}
