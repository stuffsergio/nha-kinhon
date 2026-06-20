import { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const colors = {
  success: "bg-[#059669]",
  error: "bg-[#dc2626]",
  info: "bg-[#0066cc]",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-24 right-6 z-[99999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || Info;
          return (
            <div
              key={toast.id}
              className={`${colors[toast.type]} pointer-events-auto text-white px-5 py-4 rounded-[14px] shadow-2xl flex items-center gap-3 w-full max-w-[400px] animate-toast-in`}
            >
              <Icon size={22} className="shrink-0" />
              <p className="font-apple-body text-[15px] font-normal leading-[1.4] flex-1 min-w-0 break-words">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="shrink-0 hover:opacity-70 transition-opacity text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
