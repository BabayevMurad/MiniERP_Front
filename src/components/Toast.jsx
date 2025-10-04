import { useEffect } from "react";

export default function Toast({ show, type = "success", text, onClose, duration = 2000 }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [show, duration, onClose]);

  if (!show) return null;

  const color =
    type === "success" ? "bg-green-600" :
    type === "error"   ? "bg-red-600"   :
    "bg-gray-700";

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`${color} text-white px-4 py-2 rounded shadow-lg`}>
        {text}
      </div>
    </div>
  );
}
