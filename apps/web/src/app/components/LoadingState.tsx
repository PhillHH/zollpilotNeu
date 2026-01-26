"use client";

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  message?: string;
};

/**
 * Loading Spinner Komponente.
 */
export function LoadingSpinner({ size = "md", message }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "16px",
    md: "24px",
    lg: "40px",
  };

  return (
    <div className="loading-spinner">
      <div
        className="spinner"
        style={{ width: sizeMap[size], height: sizeMap[size] }}
      />
      {message && <p className="loading-message">{message}</p>}

      <style jsx>{`
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem;
        }

        .spinner {
          border: 2px solid var(--color-border, #2a2a35);
          border-top-color: var(--color-primary, #6366f1);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .loading-message {
          margin: 0;
          font-size: 0.9rem;
          color: var(--color-text-muted, #8b8b9e);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

type LoadingOverlayProps = {
  message?: string;
};

/**
 * Loading Overlay für ganze Seiten/Bereiche.
 */
export function LoadingOverlay({ message = "Laden..." }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <LoadingSpinner size="lg" message={message} />

      <style jsx>{`
        .loading-overlay {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          width: 100%;
        }
      `}</style>
    </div>
  );
}

type SkeletonProps = {
  width?: string;
  height?: string;
  variant?: "text" | "rect" | "circle";
};

/**
 * Skeleton Loading Placeholder.
 */
export function Skeleton({
  width = "100%",
  height = "1rem",
  variant = "text",
}: SkeletonProps) {
  const borderRadius = variant === "circle" ? "50%" : variant === "text" ? "4px" : "8px";

  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
      }}
    >
      <style jsx>{`
        .skeleton {
          background: linear-gradient(
            90deg,
            var(--color-surface, #1a1a21) 0%,
            var(--color-border, #2a2a35) 50%,
            var(--color-surface, #1a1a21) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}

type SkeletonListProps = {
  count?: number;
  itemHeight?: string;
};

/**
 * Skeleton-Liste für Loading States.
 */
export function SkeletonList({ count = 3, itemHeight = "4rem" }: SkeletonListProps) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={itemHeight} variant="rect" />
      ))}

      <style jsx>{`
        .skeleton-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
      `}</style>
    </div>
  );
}

type SaveStatusProps = {
  status: "idle" | "saving" | "saved" | "error";
};

/**
 * Save Status Indicator für Autosave.
 */
export function SaveStatus({ status }: SaveStatusProps) {
  const statusConfig = {
    idle: { text: "", icon: "" },
    saving: { text: "Speichere...", icon: "⏳" },
    saved: { text: "Gespeichert", icon: "✓" },
    error: { text: "Fehler", icon: "✗" },
  };

  if (status === "idle") return null;

  const { text, icon } = statusConfig[status];

  return (
    <span className={`save-status save-status-${status}`}>
      <span className="status-icon">{icon}</span>
      <span className="status-text">{text}</span>

      <style jsx>{`
        .save-status {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          transition: opacity 0.3s;
        }

        .save-status-saving {
          color: var(--color-text-muted, #8b8b9e);
        }

        .save-status-saved {
          color: var(--color-success, #4ade80);
        }

        .save-status-error {
          color: var(--color-error, #f87171);
        }

        .status-icon {
          font-size: 0.85rem;
        }
      `}</style>
    </span>
  );
}

