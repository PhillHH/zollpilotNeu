"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageShell } from "../design-system/primitives/PageShell";

type PublicLayoutProps = {
  children: React.ReactNode;
};

/**
 * PublicLayout – Layout für öffentliche Seiten (Landing, Blog, FAQ)
 * 
 * Verwendet das ZollPilot Design System v1.
 * Ruhiger SaaS/GovTech-Stil mit viel Weißraum.
 */
export function PublicLayout({ children }: PublicLayoutProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <PageShell
      header={<Header isActive={isActive} />}
      footer={<Footer />}
    >
      {children}
    </PageShell>
  );
}

/** Header mit Navigation */
function Header({ isActive }: { isActive: (path: string) => boolean }) {
  return (
    <nav className="header">
      <div className="header__container">
        {/* Logo */}
        <Link href="/" className="header__logo">
          <span className="logo-icon">📦</span>
          <span className="logo-text">ZollPilot</span>
        </Link>

        {/* Navigation */}
        <div className="header__nav">
          <Link
            href="/"
            className={`nav-link ${isActive("/") && !isActive("/blog") && !isActive("/faq") ? "nav-link--active" : ""}`}
          >
            Start
          </Link>
          <Link
            href="/blog"
            className={`nav-link ${isActive("/blog") ? "nav-link--active" : ""}`}
          >
            Blog
          </Link>
          <Link
            href="/faq"
            className={`nav-link ${isActive("/faq") ? "nav-link--active" : ""}`}
          >
            FAQ
          </Link>
        </div>

        {/* CTA */}
        <div className="header__actions">
          <Link href="/login" className="header__login">
            Anmelden
          </Link>
          <Link href="/register" className="header__cta">
            Jetzt starten
          </Link>
        </div>
      </div>

      <style jsx>{`
        .header {
          padding: var(--space-md) var(--space-lg);
        }

        .header__container {
          max-width: var(--max-width-xl);
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-lg);
        }

        .header :global(.header__logo) {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          text-decoration: none;
          color: var(--color-text);
        }

        .logo-icon {
          font-size: 1.5rem;
        }

        .logo-text {
          font-size: var(--text-xl);
          font-weight: var(--font-bold);
          color: var(--color-primary);
        }

        .header__nav {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .header :global(.nav-link) {
          padding: var(--space-sm) var(--space-md);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-muted);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: color var(--transition-fast), 
                      background var(--transition-fast);
        }

        .header :global(.nav-link):hover {
          color: var(--color-text);
          background: var(--color-border-light);
        }

        .header :global(.nav-link--active) {
          color: var(--color-primary);
          background: var(--color-primary-softer);
        }

        .header__actions {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .header :global(.header__login) {
          padding: var(--space-sm) var(--space-md);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-muted);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: color var(--transition-fast);
        }

        .header :global(.header__login):hover {
          color: var(--color-text);
        }

        .header :global(.header__cta) {
          padding: var(--space-sm) var(--space-md);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-on-primary);
          background: var(--color-primary);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: background var(--transition-fast);
        }

        .header :global(.header__cta):hover {
          background: var(--color-primary-hover);
        }

        @media (max-width: 768px) {
          .header__nav {
            display: none;
          }

          .header :global(.header__login) {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}

/** Footer */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        {/* Hauptbereich */}
        <div className="footer__main">
          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <span className="logo-icon">📦</span>
              <span className="logo-text">ZollPilot</span>
            </div>
            <p className="footer__tagline">
              Die einfache Lösung für Ihre Zollanmeldung bei Internetbestellungen
              aus dem Ausland.
            </p>
          </div>

          {/* Links */}
          <div className="footer__links">
            <div className="footer__column">
              <h4 className="footer__heading">Ressourcen</h4>
              <ul className="footer__list">
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/faq">Häufige Fragen</Link></li>
              </ul>
            </div>

            <div className="footer__column">
              <h4 className="footer__heading">Rechtliches</h4>
              <ul className="footer__list">
                <li><Link href="/impressum">Impressum</Link></li>
                <li><Link href="/datenschutz">Datenschutz</Link></li>
              </ul>
            </div>

            <div className="footer__column">
              <h4 className="footer__heading">Produkt</h4>
              <ul className="footer__list">
                <li><Link href="/register">Registrieren</Link></li>
                <li><Link href="/login">Anmelden</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer__bottom">
          <p className="footer__disclaimer">
            ZollPilot bereitet Zollanmeldungen vor. Die eigentliche Anmeldung führen Sie selbst durch.
          </p>
          <p>© {new Date().getFullYear()} ZollPilot. Alle Rechte vorbehalten.</p>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: var(--color-surface);
          border-top: 1px solid var(--color-border);
          padding: var(--space-3xl) var(--space-lg) var(--space-xl);
        }

        .footer__container {
          max-width: var(--max-width-xl);
          margin: 0 auto;
        }

        .footer__main {
          display: grid;
          grid-template-columns: 2fr 3fr;
          gap: var(--space-3xl);
          margin-bottom: var(--space-2xl);
        }

        .footer__brand {
          max-width: 280px;
        }

        .footer__logo {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
        }

        .logo-icon {
          font-size: 1.5rem;
        }

        .logo-text {
          font-size: var(--text-lg);
          font-weight: var(--font-bold);
          color: var(--color-primary);
        }

        .footer__tagline {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          line-height: var(--leading-relaxed);
          margin: 0;
        }

        .footer__links {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-xl);
        }

        .footer__heading {
          font-size: var(--text-sm);
          font-weight: var(--font-semibold);
          color: var(--color-text);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 var(--space-md) 0;
        }

        .footer__list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .footer__list li {
          margin: var(--space-sm) 0;
        }

        .footer__list :global(a) {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .footer__list :global(a):hover {
          color: var(--color-primary);
        }

        .footer__bottom {
          padding-top: var(--space-xl);
          border-top: 1px solid var(--color-border);
          text-align: center;
        }

        .footer__disclaimer {
          font-size: var(--text-xs);
          color: var(--color-text-light);
          margin: 0 0 var(--space-sm) 0;
        }

        .footer__bottom p {
          font-size: var(--text-sm);
          color: var(--color-text-light);
          margin: 0;
        }

        @media (max-width: 768px) {
          .footer__main {
            grid-template-columns: 1fr;
            gap: var(--space-2xl);
          }

          .footer__brand {
            max-width: 100%;
          }

          .footer__links {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .footer__links {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </footer>
  );
}
