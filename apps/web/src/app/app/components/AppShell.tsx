"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PageShell } from "../../design-system/primitives/PageShell";
import { apiRequest } from "../../lib/api/client";

type AppShellProps = {
  children: React.ReactNode;
};

type AuthInfo = {
  canAccessAdmin: boolean;
};

/**
 * AppShell – Layout für den App-Bereich (/app/*)
 *
 * Verwendet das ZollPilot Design System v1.
 * Header mit Navigation, Footer mit Links.
 * Shows admin link only for SYSTEM_ADMIN users.
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [auth, setAuth] = useState<AuthInfo | null>(null);

  useEffect(() => {
    async function loadAuth() {
      try {
        const data = await apiRequest<{ data: { permissions?: { can_access_admin?: boolean } } }>(
          "/auth/me"
        );
        setAuth({
          canAccessAdmin: data.data?.permissions?.can_access_admin ?? false,
        });
      } catch {
        // Ignore errors - admin link just won't show
      }
    }
    loadAuth();
  }, []);

  const isActive = (path: string) => {
    if (path === "/app") return pathname === "/app";
    if (path === "/app/profile") return pathname === "/app/profile";
    return pathname.startsWith(path);
  };

  return (
    <PageShell
      header={
        <AppHeader
          isActive={isActive}
          canAccessAdmin={auth?.canAccessAdmin ?? false}
        />
      }
      footer={<AppFooter />}
    >
      {children}
    </PageShell>
  );
}

/** App Header mit Navigation */
function AppHeader({
  isActive,
  canAccessAdmin,
}: {
  isActive: (path: string) => boolean;
  canAccessAdmin: boolean;
}) {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Logo */}
        <Link href="/app" className="header-logo">
          <span className="logo-icon">📦</span>
          <span className="logo-text">ZollPilot</span>
        </Link>

        {/* Main Navigation */}
        <nav className="header-nav">
          <Link
            href="/app"
            className={`nav-link ${isActive("/app") && !isActive("/app/cases") && !isActive("/app/billing") ? "nav-link--active" : ""}`}
          >
            Übersicht
          </Link>
          <Link
            href="/app/cases"
            className={`nav-link ${isActive("/app/cases") ? "nav-link--active" : ""}`}
          >
            Fälle
          </Link>
          <Link
            href="/app/billing"
            className={`nav-link ${isActive("/app/billing") ? "nav-link--active" : ""}`}
          >
            Kosten & Credits
          </Link>
        </nav>

        {/* User Actions */}
        <div className="header-actions">
          <Link
            href="/app/profile"
            className={`profile-link ${isActive("/app/profile") ? "profile-link--active" : ""}`}
          >
            Profil
          </Link>
          {canAccessAdmin && (
            <Link href="/admin" className="admin-link">
              Admin
            </Link>
          )}
          <button onClick={handleLogout} className="logout-link">
            Abmelden
          </button>
        </div>
      </div>

      <style jsx>{`
        .app-header {
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

        .app-header :global(.header-logo) {
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
          color: var(--color-primary);
        }

        .header-nav {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          flex: 1;
        }

        .app-header :global(.nav-link) {
          padding: var(--space-sm) var(--space-md);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-muted);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition:
            color var(--transition-fast),
            background var(--transition-fast);
        }

        .app-header :global(.nav-link):hover {
          color: var(--color-text);
          background: var(--color-border-light);
        }

        .app-header :global(.nav-link--active) {
          color: var(--color-primary);
          background: var(--color-primary-softer);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .app-header :global(.profile-link) {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-muted);
          text-decoration: none;
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-md);
          transition:
            color var(--transition-fast),
            background var(--transition-fast);
        }

        .app-header :global(.profile-link):hover {
          color: var(--color-text);
          background: var(--color-border-light);
        }

        .app-header :global(.profile-link--active) {
          color: var(--color-primary);
          background: var(--color-primary-softer);
        }

        .app-header :global(.admin-link) {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-primary);
          text-decoration: none;
          padding: var(--space-xs) var(--space-sm);
          border: 1px solid var(--color-primary);
          border-radius: var(--radius-md);
          transition:
            color var(--transition-fast),
            background var(--transition-fast);
        }

        .app-header :global(.admin-link):hover {
          color: var(--color-text-on-primary);
          background: var(--color-primary);
        }

        .app-header :global(.logout-link) {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-family: inherit;
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .app-header :global(.logout-link):hover {
          color: var(--color-danger);
        }

        @media (max-width: 768px) {
          .header-nav {
            gap: 0;
          }

          .app-header :global(.nav-link) {
            padding: var(--space-xs) var(--space-sm);
            font-size: var(--text-xs);
          }

          .logo-text {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}

/** App Footer */
function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-content">
          <p className="footer-disclaimer">
            ZollPilot übermittelt keine Daten an Zollbehörden und führt keine
            Zollanmeldungen durch.
          </p>
          <p className="footer-copyright">
            © {new Date().getFullYear()} ZollPilot
          </p>
        </div>
        <nav className="footer-links">
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutz">Datenschutz</Link>
          <Link href="/faq">Hilfe</Link>
        </nav>
      </div>

      <style jsx>{`
        .app-footer {
          padding: var(--space-md) var(--space-lg);
          background: var(--color-surface);
          border-top: 1px solid var(--color-border);
        }

        .footer-container {
          max-width: var(--max-width-xl);
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .footer-disclaimer {
          font-size: var(--text-xs);
          color: var(--color-text-light);
          margin: 0;
        }

        .footer-copyright {
          font-size: var(--text-sm);
          color: var(--color-text-light);
          margin: 0;
        }

        .footer-links {
          display: flex;
          gap: var(--space-lg);
        }

        .app-footer :global(a) {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .app-footer :global(a):hover {
          color: var(--color-primary);
        }

        @media (max-width: 640px) {
          .footer-container {
            flex-direction: column;
            gap: var(--space-sm);
          }

          .footer-links {
            gap: var(--space-md);
          }
        }
      `}</style>
    </footer>
  );
}
