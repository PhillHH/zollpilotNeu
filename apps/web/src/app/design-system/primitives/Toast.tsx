"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (message: string, variant?: ToastVariant, options?: { duration?: number; action?: ToastMessage["action"] }) => void;
  dismissToast: (id: string) => void;
  // Convenience methods
  success: (message: string, options?: { duration?: number }) => void;
  error: (message: string, options?: { duration?: number; action?: ToastMessage["action"] }) => void;
  warning: (message: string, options?: { duration?: number }) => void;
  info: (message: string, options?: { duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      variant: ToastVariant = "info",
      options?: { duration?: number; action?: ToastMessage["action"] }
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const duration = options?.duration ?? (variant === "error" ? 8000 : 5000);

      setToasts((prev) => [...prev, { id, message, variant, duration, action: options?.action }]);

      // Auto-dismiss (unless it's an error with action)
      if (duration > 0 && !(variant === "error" && options?.action)) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const success = useCallback(
    (message: string, options?: { duration?: number }) => {
      showToast(message, "success", options);
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, options?: { duration?: number; action?: ToastMessage["action"] }) => {
      showToast(message, "error", options);
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, options?: { duration?: number }) => {
      showToast(message, "warning", options);
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, options?: { duration?: number }) => {
      showToast(message, "info", options);
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

// Toast Container Component
interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
      <style jsx>{`
        .toast-container {
          position: fixed;
          bottom: var(--space-lg);
          right: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          z-index: 10000;
          max-width: 400px;
          width: calc(100% - var(--space-lg) * 2);
        }

        @media (max-width: 480px) {
          .toast-container {
            bottom: var(--space-md);
            left: var(--space-md);
            right: var(--space-md);
            width: auto;
          }
        }
      `}</style>
    </div>
  );
}

// Individual Toast Item
interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(onDismiss, 200); // Wait for exit animation
  }, [onDismiss]);

  const variantStyles: Record<ToastVariant, { bg: string; border: string; icon: string }> = {
    success: {
      bg: "var(--color-success-light, #ecfdf5)",
      border: "var(--color-success, #10b981)",
      icon: "✓",
    },
    error: {
      bg: "var(--color-danger-light, #fef2f2)",
      border: "var(--color-danger, #ef4444)",
      icon: "✕",
    },
    warning: {
      bg: "var(--color-warning-light, #fffbeb)",
      border: "var(--color-warning, #f59e0b)",
      icon: "⚠",
    },
    info: {
      bg: "var(--color-info-light, #eff6ff)",
      border: "var(--color-info, #3b82f6)",
      icon: "ℹ",
    },
  };

  const style = variantStyles[toast.variant];

  return (
    <div
      className={`toast-item ${isExiting ? "toast-exit" : "toast-enter"}`}
      role="alert"
      aria-live="polite"
    >
      <span className="toast-icon">{style.icon}</span>
      <div className="toast-content">
        <p className="toast-message">{toast.message}</p>
        {toast.action && (
          <button className="toast-action" onClick={toast.action.onClick}>
            {toast.action.label}
          </button>
        )}
      </div>
      <button className="toast-close" onClick={handleDismiss} aria-label="Schließen">
        ×
      </button>
      <style jsx>{`
        .toast-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-sm);
          padding: var(--space-md);
          background: ${style.bg};
          border: 1px solid ${style.border};
          border-left: 4px solid ${style.border};
          border-radius: var(--radius-md);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          animation: toast-in 0.2s ease-out;
        }

        .toast-enter {
          animation: toast-in 0.2s ease-out;
        }

        .toast-exit {
          animation: toast-out 0.2s ease-in forwards;
        }

        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes toast-out {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }

        .toast-icon {
          flex-shrink: 0;
          font-size: 1rem;
          line-height: 1;
          margin-top: 2px;
        }

        .toast-content {
          flex: 1;
          min-width: 0;
        }

        .toast-message {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--color-text);
          line-height: 1.4;
        }

        .toast-action {
          display: inline-block;
          margin-top: var(--space-xs);
          padding: var(--space-xs) var(--space-sm);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: ${style.border};
          background: transparent;
          border: 1px solid ${style.border};
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .toast-action:hover {
          background: ${style.border};
          color: white;
        }

        .toast-close {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          font-size: 1.25rem;
          color: var(--color-text-muted);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: all 0.15s ease;
        }

        .toast-close:hover {
          background: rgba(0, 0, 0, 0.1);
          color: var(--color-text);
        }

        @media (max-width: 480px) {
          .toast-item {
            padding: var(--space-sm);
          }
        }
      `}</style>
    </div>
  );
}
