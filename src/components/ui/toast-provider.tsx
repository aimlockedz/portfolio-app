"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X, Trash2, LogOut } from "lucide-react";

/* ─── Toast Types ─── */
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

/* ─── Confirm Dialog Types ─── */
interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  icon?: "trash" | "logout" | "warning";
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/* ─── Icons ─── */
const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
  error: <XCircle className="h-5 w-5 text-red-400" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
  info: <Info className="h-5 w-5 text-blue-400" />,
};

const TOAST_BG: Record<ToastType, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10",
  error: "border-red-500/30 bg-red-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
  info: "border-blue-500/30 bg-blue-500/10",
};

const CONFIRM_ICONS: Record<string, React.ReactNode> = {
  trash: <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center"><Trash2 className="h-6 w-6 text-red-400" /></div>,
  logout: <div className="w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center"><LogOut className="h-6 w-6 text-amber-400" /></div>,
  warning: <div className="w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center"><AlertTriangle className="h-6 w-6 text-amber-400" /></div>,
};

const CONFIRM_BTN: Record<string, string> = {
  danger: "bg-red-500 hover:bg-red-600 text-white",
  warning: "bg-amber-500 hover:bg-amber-600 text-white",
  info: "bg-blue-500 hover:bg-blue-600 text-white",
};

/* ─── Toast Item Component ─── */
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const dur = toast.duration ?? 3000;
    const exitTimer = setTimeout(() => setExiting(true), dur - 300);
    const removeTimer = setTimeout(onClose, dur);
    return () => { clearTimeout(exitTimer); clearTimeout(removeTimer); };
  }, [toast, onClose]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl shadow-black/20 max-w-sm w-full transition-all duration-300 ${TOAST_BG[toast.type]} ${
        exiting ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0"
      }`}
      style={{ animation: "slideInRight 0.3s ease-out" }}
    >
      <div className="mt-0.5 shrink-0">{TOAST_ICONS[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[var(--foreground)]">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">{toast.message}</p>
        )}
      </div>
      <button onClick={() => { setExiting(true); setTimeout(onClose, 300); }} className="shrink-0 mt-0.5 p-0.5 rounded-full hover:bg-white/10 transition-colors">
        <X className="h-3.5 w-3.5 text-[var(--on-surface-variant)]" />
      </button>
    </div>
  );
}

/* ─── Confirm Dialog Component ─── */
function ConfirmDialog({
  options,
  onConfirm,
  onCancel,
}: {
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [closing, setClosing] = useState(false);

  const handleConfirm = () => {
    setClosing(true);
    setTimeout(onConfirm, 200);
  };
  const handleCancel = () => {
    setClosing(true);
    setTimeout(onCancel, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-200 ${closing ? "opacity-0" : "opacity-100"}`}
      style={{ animation: "fadeIn 0.2s ease-out" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancel} />

      {/* Dialog */}
      <div
        className={`relative bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl shadow-black/30 max-w-sm w-full p-6 transition-all duration-200 ${
          closing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
        style={{ animation: "scaleIn 0.2s ease-out" }}
      >
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          {options.icon && CONFIRM_ICONS[options.icon] && (
            <div className="mb-4">{CONFIRM_ICONS[options.icon]}</div>
          )}

          {/* Title */}
          <h3 className="font-bold text-lg text-[var(--foreground)]">{options.title}</h3>
          <p className="text-sm text-[var(--on-surface-variant)] mt-2 leading-relaxed">{options.message}</p>

          {/* Buttons */}
          <div className="flex gap-3 mt-6 w-full">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)] transition-all"
            >
              {options.cancelText || "Cancel"}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${CONFIRM_BTN[options.variant || "danger"]}`}
            >
              {options.confirmText || "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Provider ─── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const idRef = useRef(0);

  const addToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = `toast-${++idRef.current}`;
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const confirmFn = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const ctx: ToastContextType = {
    toast: addToast,
    success: (t, m) => addToast("success", t, m),
    error: (t, m) => addToast("error", t, m),
    warning: (t, m) => addToast("warning", t, m),
    info: (t, m) => addToast("info", t, m),
    confirm: confirmFn,
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[110] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onClose={() => removeToast(t.id)} />
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirmState && (
        <ConfirmDialog
          options={confirmState.options}
          onConfirm={() => {
            confirmState.resolve(true);
            setConfirmState(null);
          }}
          onCancel={() => {
            confirmState.resolve(false);
            setConfirmState(null);
          }}
        />
      )}

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
