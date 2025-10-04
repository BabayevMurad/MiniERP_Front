import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Header() {
  const { user } = useContext(AuthContext);
  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-5">
      <h2 className="text-lg font-semibold">Dashboard</h2>
      <div className="flex items-center gap-2">
        <span className="text-sm opacity-80">{user?.username}</span>
        <span className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-full">
          Role: {user?.role ?? "unknown"}
        </span>
      </div>
    </header>
  );
}
