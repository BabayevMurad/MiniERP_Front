import { useEffect, useState } from "react";

export default function DashboardLayout({ children }) {
  const [role, setRole] = useState("");

  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    if (savedRole) setRole(savedRole);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <main className="flex-1 flex flex-col">
        <header className="bg-white shadow p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Dashboard</h1>
        </header>

        <div className="p-6 flex-1">{children}</div>
      </main>
    </div>
  );
}
