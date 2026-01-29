"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageShell } from "../../design-system/primitives/PageShell";

type AdminShellProps = {
  children: React.ReactNode;
};

/**
 * AdminShell – Layout für den Admin-Bereich (/admin/*)
 * 
 * Ruhiger, seriöser Stil für Administratoren.
 * Verwendet das ZollPilot Design System v1.
 */
export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin";
    return pathname.startsWith(path);
  };

  return (
    <PageShell
      header={<AdminHeader isActive={isActive} />}
      footer={<AdminFooter />}
    >
      {children}
    </PageShell>
  );
}

/** Admin Header mit Navigation */
function AdminHeader({ isActive }: { isActive: (path: string) => boolean }) {
  return (
    <header className="admin-header">
      <div className="header-container">
        {/* Logo & Titel */}
        <div className="header-brand">
          <Link href="/admin" className="header-logo">
            <span className="logo-icon">⚙️</span>
            <span className="logo-text">Administration</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="header-nav">
          <Link
            href="/admin"
            className={`nav-link ${isActive("/admin") && !isActive("/admin/tenants") && !isActive("/admin/users") && !isActive("/admin/plans") && !isActive("/admin/events") ? "nav-link--active" : ""}`}
          >
            Übersicht
          </Link>
          <Link
            href="/admin/users"
            className={`nav-link ${isActive("/admin/users") ? "nav-link--active" : ""}`}
          >
            Nutzer
          </Link>
          <Link
            href="/admin/tenants"
            className={`nav-link ${isActive("/admin/tenants") ? "nav-link--active" : ""}`}
          >
            Mandanten
          </Link>
          <Link
            href="/admin/plans"
            className={`nav-link ${isActive("/admin/plans") ? "nav-link--active" : ""}`}
          >
            Tarife
          </Link>
          <Link
            href="/admin/events"
            className={`nav-link ${isActive("/admin/events") ? "nav-link--active" : ""}`}
          >
            Historie
          </Link>
        </nav>

        {/* Zurück zur App */}
        <div className="header-actions">
          <Link href="/app" className="back-to-app">
            ← Zur App
          </Link>
        </div>
      </div>

      <style jsx>{`
        .admin-header {
          padding: var(--space-md) var(--space-lg);
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
        }

        .header-container {
          max-width: var(--max-width-xl);
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: var(--space-xl);
        }

        .header-brand {
          display: flex;
          align-items: center;
        }

        .admin-header :global(.header-logo) {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          text-decoration: none;
          color: var(--color-text);
        }

        .logo-icon {
          font-size: 1.25rem;
        }

        .logo-text {
          font-size: var(--text-lg);
          font-weight: var(--font-bold);
          color: var(--color-text);
        }

        .header-nav {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          flex: 1;
        }

        .admin-header :global(.nav-link) {
          padding: var(--space-sm) var(--space-md);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-muted);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: color var(--transition-fast),
                      background var(--transition-fast);
        }

        .admin-header :global(.nav-link):hover {
          color: var(--color-text);
          background: var(--color-border-light);
        }

        .admin-header :global(.nav-link--active) {
          color: var(--color-primary);
          background: var(--color-primary-softer);
        }

        .header-actions {
          display: flex;
          align-items: center;
        }

        .admin-header :global(.back-to-app) {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .admin-header :global(.back-to-app):hover {
          color: var(--color-primary);
        }

        @media (max-width: 768px) {
          .header-nav {
            gap: 0;
          }

          .admin-header :global(.nav-link) {
            padding: var(--space-xs) var(--space-sm);
            font-size: var(--text-xs);
          }

          .logo-text {
            font-size: var(--text-base);
          }
        }
      `}</style>
    </header>
  );
}

/** Admin Footer */
function AdminFooter() {
  return (
    <footer className="admin-footer">
      <div className="footer-container">
        <p className="footer-text">
          ZollPilot Administration • Nur für autorisierte Benutzer
        </p>
      </div>

      <style jsx>{`
        .admin-footer {
          padding: var(--space-md) var(--space-lg);
          background: var(--color-surface);
          border-top: 1px solid var(--color-border);
        }

        .footer-container {
          max-width: var(--max-width-xl);
          margin: 0 auto;
          text-align: center;
        }

        .footer-text {
          font-size: var(--text-sm);
          color: var(--color-text-light);
          margin: 0;
        }
      `}</style>
    </footer>
  );
}

