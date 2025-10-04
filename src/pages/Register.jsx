import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({ username: "", password: "", email: "", role: "user" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Register failed");
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-green-100">
      <form className="bg-white p-8 rounded shadow-md w-96" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <input className="w-full p-2 mb-2 border rounded" placeholder="Username"
          value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
        <input className="w-full p-2 mb-2 border rounded" placeholder="Email"
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input className="w-full p-2 mb-2 border rounded" placeholder="Password" type="password"
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        <select className="w-full p-2 mb-4 border rounded"
          value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700" type="submit">
          Register
        </button>
      </form>
    </div>
  );
}
