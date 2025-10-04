import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
}
