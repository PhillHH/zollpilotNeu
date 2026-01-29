"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Section } from "../../../design-system/primitives/Section";
import { Card } from "../../../design-system/primitives/Card";
import { Button } from "../../../design-system/primitives/Button";
import { Badge } from "../../../design-system/primitives/Badge";
import { Alert } from "../../../design-system/primitives/Alert";
import { admin, type UserDetail, type UserEvent } from "../../../lib/api/client";

type UserDetailClientProps = {
  userId: string;
};

/**
 * User Detail Client – Nutzerdetails mit Event-Historie
 */
export function UserDetailClient({ userId }: UserDetailClientProps) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const response = await admin.users.get(userId);
      setUser(response.data);
    } catch {
      setError("Nutzer konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUserTypeLabel = (userType: "PRIVATE" | "BUSINESS") => {
    return userType === "PRIVATE" ? "Privat" : "Unternehmen";
  };

  const getUserTypeVariant = (userType: "PRIVATE" | "BUSINESS") => {
    return userType === "PRIVATE" ? "default" : "info";
  };

  const getStatusVariant = (status: "ACTIVE" | "DISABLED") => {
    return status === "ACTIVE" ? "success" : "danger";
  };

  const getStatusLabel = (status: "ACTIVE" | "DISABLED") => {
    return status === "ACTIVE" ? "Aktiv" : "Deaktiviert";
  };

  const getEventLabel = (type: string): string => {
    switch (type) {
      case "REGISTERED":
        return "Registrierung";
      case "LOGIN":
        return "Login";
      case "LOGOUT":
        return "Logout";
      case "PASSWORD_RESET":
        return "Passwort-Reset";
      case "STATUS_CHANGED":
        return "Status geändert";
      default:
        return type;
    }
  };

  const getEventVariant = (type: string): "success" | "info" | "warning" | "danger" | "default" => {
    switch (type) {
      case "REGISTERED":
        return "success";
      case "LOGIN":
        return "info";
      case "LOGOUT":
        return "default";
      case "PASSWORD_RESET":
        return "warning";
      case "STATUS_CHANGED":
        return "warning";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Section maxWidth="xl" padding="xl">
        <div className="loading-state">
          <p>Nutzer wird geladen...</p>
        </div>
        <style jsx>{`
          .loading-state {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 300px;
            color: var(--color-text-muted);
          }
        `}</style>
      </Section>
    );
  }

  if (!user) {
    return (
      <Section maxWidth="xl" padding="xl">
        <Alert variant="error">Nutzer nicht gefunden.</Alert>
        <div className="back-link-container">
          <Link href="/admin/users">
            <Button variant="secondary">Zurück zur Übersicht</Button>
          </Link>
        </div>
        <style jsx>{`
          .back-link-container {
            margin-top: var(--space-lg);
          }
        `}</style>
      </Section>
    );
  }

  return (
    <Section maxWidth="xl" padding="xl">
      {/* Header */}
      <header className="detail-header">
        <Link href="/admin/users" className="back-link">
          ← Zurück zur Nutzerübersicht
        </Link>
        <h1 className="user-email">{user.email}</h1>
        <p className="user-id">ID: {user.id}</p>
      </header>

      {/* Error */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Info Cards */}
      <div className="cards-grid">
        {/* Stammdaten */}
        <Card title="Stammdaten" padding="lg">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">E-Mail</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Typ</span>
              <Badge variant={getUserTypeVariant(user.user_type)}>
                {getUserTypeLabel(user.user_type)}
              </Badge>
            </div>
            <div className="info-item">
              <span className="info-label">Status</span>
              <Badge variant={getStatusVariant(user.status)}>
                {getStatusLabel(user.status)}
              </Badge>
            </div>
            <div className="info-item">
              <span className="info-label">Registriert am</span>
              <span className="info-value">{formatDate(user.created_at)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Letzter Login</span>
              <span className="info-value">{formatDateTime(user.last_login_at)}</span>
            </div>
          </div>
        </Card>

        {/* Mandant */}
        <Card title="Mandant" padding="lg">
          {user.tenant_id ? (
            <div className="tenant-info">
              <div className="tenant-name">{user.tenant_name}</div>
              <Link href={`/admin/tenants/${user.tenant_id}`}>
                <Button variant="secondary" size="sm">
                  Mandant anzeigen
                </Button>
              </Link>
            </div>
          ) : (
            <div className="no-tenant">
              <span className="no-tenant-text">Kein Mandant zugeordnet</span>
              <p className="no-tenant-hint">
                Dieser Nutzer ist ein Privatnutzer ohne Firmenzugehörigkeit.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Event Historie */}
      <Card title="Aktivitäts-Historie" description="Letzte 50 Ereignisse" padding="none">
        {user.events.length === 0 ? (
          <div className="empty-state">
            <p>Keine Ereignisse vorhanden.</p>
          </div>
        ) : (
          <table className="events-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Ereignis</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {user.events.map((event) => (
                <tr key={event.id}>
                  <td className="date-cell">{formatDateTime(event.created_at)}</td>
                  <td>
                    <Badge variant={getEventVariant(event.type)} size="sm">
                      {getEventLabel(event.type)}
                    </Badge>
                  </td>
                  <td className="details-cell">
                    {formatEventMetadata(event)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <style jsx>{`
        .detail-header {
          margin-bottom: var(--space-xl);
        }

        :global(.back-link) {
          display: inline-block;
          color: var(--color-primary);
          font-size: var(--text-sm);
          text-decoration: none;
          margin-bottom: var(--space-md);
        }

        :global(.back-link):hover {
          text-decoration: underline;
        }

        .user-email {
          font-size: var(--heading-h1);
          color: var(--color-text);
          margin: 0 0 var(--space-xs) 0;
        }

        .user-id {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          font-family: var(--font-mono);
          margin: 0;
        }

        /* Cards Grid */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-lg);
          margin-bottom: var(--space-lg);
        }

        /* Info Grid */
        .info-grid {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-sm) 0;
          border-bottom: 1px solid var(--color-border-light);
        }

        .info-item:last-child {
          border-bottom: none;
        }

        .info-label {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        .info-value {
          font-size: var(--text-base);
          color: var(--color-text);
          font-weight: var(--font-medium);
        }

        /* Tenant Info */
        .tenant-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-lg);
          background: var(--color-primary-softer);
          border-radius: var(--radius-md);
        }

        .tenant-name {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-text);
        }

        .no-tenant {
          text-align: center;
          padding: var(--space-lg);
        }

        .no-tenant-text {
          font-size: var(--text-base);
          color: var(--color-text-muted);
          font-style: italic;
        }

        .no-tenant-hint {
          font-size: var(--text-sm);
          color: var(--color-text-light);
          margin: var(--space-sm) 0 0 0;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: var(--space-2xl);
          color: var(--color-text-muted);
        }

        /* Events Table */
        .events-table {
          width: 100%;
          border-collapse: collapse;
        }

        .events-table th,
        .events-table td {
          padding: var(--space-md);
          text-align: left;
          border-bottom: 1px solid var(--color-border-light);
        }

        .events-table th {
          font-size: var(--text-xs);
          font-weight: var(--font-semibold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
          background: var(--color-bg);
        }

        .date-cell {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          white-space: nowrap;
        }

        .details-cell {
          font-size: var(--text-sm);
          color: var(--color-text-light);
        }

        @media (max-width: 768px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }

          .events-table th,
          .events-table td {
            padding: var(--space-sm);
            font-size: var(--text-sm);
          }
        }
      `}</style>
    </Section>
  );
}

/** Format event metadata for display */
function formatEventMetadata(event: UserEvent): string {
  if (!event.metadata_json) return "—";

  const meta = event.metadata_json as Record<string, unknown>;

  if (meta.migrated) return "Aus Migration";
  if (meta.source) return `Quelle: ${meta.source}`;
  if (meta.ip) return `IP: ${meta.ip}`;
  if (meta.old_status && meta.new_status) {
    return `${meta.old_status} → ${meta.new_status}`;
  }

  return "—";
}
