"use client";
import { createContext, useContext, useCallback, useRef, useState, useEffect, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

/* ── Types ── */
type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  leaving?: boolean;
}

interface ToastCtx {
  toast: (msg: string, type?: ToastType, duration?: number) => void;
  success: (msg: string, duration?: number) => void;
  error: (msg: string, duration?: number) => void;
  info: (msg: string, duration?: number) => void;
}

/* ── Context ── */
const ToastContext = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

/* ── Provider ── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 280);
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", duration = 3500) => {
      const id = `toast-${++counterRef.current}`;
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const success = useCallback((msg: string, dur?: number) => toast(msg, "success", dur), [toast]);
  const error   = useCallback((msg: string, dur?: number) => toast(msg, "error",   dur ?? 5000), [toast]);
  const info    = useCallback((msg: string, dur?: number) => toast(msg, "info",    dur), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      {/* Portal */}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "0.625rem",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ── Single toast item ── */
const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 style={{ width: 16, height: 16, color: "#22c55e" }} />,
  error:   <AlertCircle  style={{ width: 16, height: 16, color: "var(--destructive)" }} />,
  info:    <Info         style={{ width: 16, height: 16, color: "var(--primary)" }} />,
};

const BORDER_COLORS: Record<ToastType, string> = {
  success: "rgba(34,197,94,0.35)",
  error:   "rgba(239,68,68,0.35)",
  info:    "oklch(0.78 0.14 195 / 0.35)",
};

const BAR_COLORS: Record<ToastType, string> = {
  success: "#22c55e",
  error:   "var(--destructive)",
  info:    "var(--primary)",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!progressRef.current) return;
    const el = progressRef.current;
    el.style.animationDuration = `${toast.duration ?? 3500}ms`;
  }, [toast.duration]);

  return (
    <div
      className={toast.leaving ? "toast-out" : "toast-in"}
      style={{
        pointerEvents: "auto",
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.625rem",
        minWidth: 280,
        maxWidth: 380,
        overflow: "hidden",
        borderRadius: "0.875rem",
        border: `1px solid ${BORDER_COLORS[toast.type]}`,
        background: "oklch(0.20 0.018 240 / 0.95)",
        backdropFilter: "blur(12px)",
        padding: "0.75rem 1rem",
        boxShadow: "0 8px 32px oklch(0 0 0 / 0.4)",
      }}
    >
      {/* Icon */}
      <div style={{ marginTop: 1, flexShrink: 0 }}>{ICONS[toast.type]}</div>

      {/* Message */}
      <p style={{ flex: 1, fontSize: "0.8125rem", lineHeight: 1.5, color: "var(--foreground)", margin: 0 }}>
        {toast.message}
      </p>

      {/* Close */}
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          borderRadius: 6,
          border: "none",
          background: "transparent",
          color: "var(--muted-foreground)",
          cursor: "pointer",
          marginTop: -1,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}
      >
        <X style={{ width: 12, height: 12 }} />
      </button>

      {/* Progress bar */}
      <div
        ref={progressRef}
        className="toast-progress"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 2,
          background: BAR_COLORS[toast.type],
          borderRadius: "0 0 0.875rem 0.875rem",
        }}
      />
    </div>
  );
}
