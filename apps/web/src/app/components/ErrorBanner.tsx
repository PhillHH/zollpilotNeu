"use client";

import { useCallback } from "react";
import { formatApiError, type ErrorCode } from "../lib/errors";
import type { ApiError } from "../lib/api/client";
import Link from "next/link";

type ErrorBannerProps = {
  error: ApiError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
};

/**
 * Einheitliches Error-Banner für API-Fehler.
 *
 * Zeigt:
 * - Benutzerfreundliche Fehlermeldung
 * - Support-Code (Request-ID)
 * - Retry-Button bei transienten Fehlern
 * - Weiterleitung bei bestimmten Fehlern (z.B. Login, Billing)
 */
export function ErrorBanner({ error, onRetry, onDismiss }: ErrorBannerProps) {
  if (!error) return null;

  const { message, supportCode, canRetry, redirectTo } = formatApiError(error);

  return (
    <div className="error-banner" role="alert">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <div className="error-details">
          <p className="error-message">{message}</p>
          {supportCode && (
            <p className="error-support-code">
              Support-Code: <code>{supportCode}</code>
            </p>
          )}
        </div>
      </div>

      <div className="error-actions">
        {canRetry && onRetry && (
          <button
            type="button"
            className="error-btn error-btn-retry"
            onClick={onRetry}
          >
            Erneut versuchen
          </button>
        )}
        {redirectTo && (
          <Link href={redirectTo} className="error-btn error-btn-redirect">
            {redirectTo === "/login" && "Anmelden"}
            {redirectTo === "/app/billing" && "Credits kaufen"}
          </Link>
        )}
        {onDismiss && (
          <button
            type="button"
            className="error-btn error-btn-dismiss"
            onClick={onDismiss}
            aria-label="Schließen"
          >
            ✕
          </button>
        )}
      </div>

      <style jsx>{`
        .error-banner {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.3);
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .error-content {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .error-icon {
          font-size: 1.25rem;
          line-height: 1;
        }

        .error-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .error-message {
          margin: 0;
          color: var(--color-error, #f87171);
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .error-support-code {
          margin: 0;
          color: var(--color-text-muted, #8b8b9e);
          font-size: 0.75rem;
        }

        .error-support-code code {
          font-family: var(--font-mono, monospace);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.1rem 0.3rem;
          border-radius: 3px;
        }

        .error-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .error-btn {
          padding: 0.4rem 0.75rem;
          font-size: 0.8rem;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s;
        }

        .error-btn-retry {
          background: var(--color-primary, #6366f1);
          color: white;
        }

        .error-btn-retry:hover {
          background: var(--color-primary-hover, #818cf8);
        }

        .error-btn-redirect {
          background: rgba(99, 102, 241, 0.2);
          color: var(--color-primary, #6366f1);
        }

        .error-btn-redirect:hover {
          background: rgba(99, 102, 241, 0.3);
        }

        .error-btn-dismiss {
          background: transparent;
          color: var(--color-text-muted, #8b8b9e);
          padding: 0.4rem;
        }

        .error-btn-dismiss:hover {
          color: var(--color-text, #e4e4eb);
        }

        @media (max-width: 640px) {
          .error-banner {
            flex-direction: column;
            gap: 0.75rem;
          }

          .error-actions {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Hook für Error State Management.
 */
export function useErrorHandler() {
  const handleError = useCallback((error: unknown): ApiError => {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      "status" in error
    ) {
      return error as ApiError;
    }

    // Fallback für unbekannte Fehler
    return {
      code: "UNKNOWN_ERROR",
      message: String(error),
      status: 500,
    };
  }, []);

  return { handleError };
}

