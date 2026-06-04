"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "success" | "error" | "info";

type ToastState = {
  message: string;
  variant: ToastVariant;
} | null;

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    setToast({ message, variant });
  }, []);

  const variantStyles: Record<ToastVariant, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-red-200 bg-red-50 text-red-900",
    info: "border-blue-200 bg-blue-50 text-blue-900",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <div
          className="pointer-events-none fixed bottom-6 left-1/2 z-[100] w-[min(92vw,24rem)] -translate-x-1/2"
          role="status"
          aria-live="polite"
        >
          <div
            className={[
              "pointer-events-auto rounded-xl border px-4 py-3 text-sm font-medium shadow-lg",
              variantStyles[toast.variant],
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <span>{toast.message}</span>
              <button
                type="button"
                className="shrink-0 text-xs opacity-70 hover:opacity-100"
                onClick={() => setToast(null)}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
