import Link from "next/link";
import { Section } from "../design-system/primitives/Section";
import { Card } from "../design-system/primitives/Card";
import "./admin.css";

/**
 * Admin Dashboard – Übersicht der Administrationsfunktionen
 */
export default function AdminPage() {
  return (
    <Section maxWidth="lg" padding="xl">
      {/* Header */}
      <header className="admin-header">
        <h1 className="admin-title">Administration</h1>
        <p className="admin-subtitle">
          Verwalten Sie Mandanten, Tarife, Guthaben und Inhalte.
        </p>
      </header>

      {/* Navigation Cards */}
      <div className="admin-grid">
        <Link href="/admin/tenants" className="admin-link">
          <Card hoverable padding="lg" className="admin-card">
            <div className="admin-card-icon">🏢</div>
            <h2 className="admin-card-title">Mandanten</h2>
            <p className="admin-card-description">
              Übersicht aller Organisationen mit Tarif- und Guthabenstatus.
            </p>
          </Card>
        </Link>

        <Link href="/admin/plans" className="admin-link">
          <Card hoverable padding="lg" className="admin-card">
            <div className="admin-card-icon">📋</div>
            <h2 className="admin-card-title">Tarife</h2>
            <p className="admin-card-description">
              Verwalten Sie Abonnement-Tarife und Preisgestaltung.
            </p>
          </Card>
        </Link>

        <Link href="/admin/content/blog" className="admin-link">
          <Card hoverable padding="lg" className="admin-card">
            <div className="admin-card-icon">📝</div>
            <h2 className="admin-card-title">Blog</h2>
            <p className="admin-card-description">
              Verwalten Sie Blog-Artikel und Veröffentlichungen.
            </p>
          </Card>
        </Link>

        <Link href="/admin/content/faq" className="admin-link">
          <Card hoverable padding="lg" className="admin-card">
            <div className="admin-card-icon">❓</div>
            <h2 className="admin-card-title">FAQ</h2>
            <p className="admin-card-description">
              Verwalten Sie häufig gestellte Fragen und Antworten.
            </p>
          </Card>
        </Link>
      </div>
    </Section>
  );
}
