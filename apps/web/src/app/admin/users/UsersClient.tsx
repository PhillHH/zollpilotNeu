"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Section } from "../../design-system/primitives/Section";
import { Card } from "../../design-system/primitives/Card";
import { Button } from "../../design-system/primitives/Button";
import { Badge } from "../../design-system/primitives/Badge";
import { Alert } from "../../design-system/primitives/Alert";
import { admin, type UserSummary } from "../../lib/api/client";

/**
 * Users Client – Nutzerübersicht im Admin-Bereich
 *
 * Zeigt alle registrierten Nutzer mit:
 * - E-Mail
 * - Typ (Privat/Unternehmen)
 * - Mandant
 * - Registriert am
 * - Letzter Login
 * - Status
 */
export function UsersClient() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await admin.users.list();
        setUsers(response.data);
      } catch {
        setError("Nutzer konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("de-DE", {
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

  if (loading) {
    return (
      <Section maxWidth="xl" padding="xl">
        <div className="loading-state">
          <p>Nutzer werden geladen...</p>
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

  return (
    <Section maxWidth="xl" padding="xl">
      {/* Header */}
      <header className="users-header">
        <div className="header-text">
          <h1 className="page-title">Nutzer</h1>
          <p className="page-subtitle">
            Übersicht aller registrierten Benutzer
          </p>
        </div>
        <div className="header-stats">
          <span className="stat-item">
            <span className="stat-value">{users.length}</span>
            <span className="stat-label">Gesamt</span>
          </span>
          <span className="stat-item">
            <span className="stat-value">{users.filter(u => u.user_type === "PRIVATE").length}</span>
            <span className="stat-label">Privat</span>
          </span>
          <span className="stat-item">
            <span className="stat-value">{users.filter(u => u.user_type === "BUSINESS").length}</span>
            <span className="stat-label">Unternehmen</span>
          </span>
        </div>
      </header>

      {/* Error */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Users Table */}
      {users.length === 0 ? (
        <Card padding="lg">
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h3 className="empty-title">Keine Nutzer vorhanden</h3>
            <p className="empty-text">
              Sobald sich Benutzer registrieren, erscheinen sie hier.
            </p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <table className="users-table">
            <thead>
              <tr>
                <th>E-Mail</th>
                <th>Typ</th>
                <th>Mandant</th>
                <th>Registriert am</th>
                <th>Letzter Login</th>
                <th>Status</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="user-email">{user.email}</td>
                  <td>
                    <Badge variant={getUserTypeVariant(user.user_type)}>
                      {getUserTypeLabel(user.user_type)}
                    </Badge>
                  </td>
                  <td className="tenant-cell">
                    {user.tenant_name ? (
                      <Link href={`/admin/tenants/${user.tenant_id}`} className="tenant-link">
                        {user.tenant_name}
                      </Link>
                    ) : (
                      <span className="no-tenant">—</span>
                    )}
                  </td>
                  <td className="date-cell">{formatDate(user.created_at)}</td>
                  <td className="date-cell">{formatDateTime(user.last_login_at)}</td>
                  <td>
                    <Badge variant={getStatusVariant(user.status)}>
                      {getStatusLabel(user.status)}
                    </Badge>
                  </td>
                  <td>
                    <Link href={`/admin/users/${user.id}`}>
                      <Button variant="ghost" size="sm">
                        Details
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <style jsx>{`
        .users-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-xl);
          flex-wrap: wrap;
          gap: var(--space-lg);
        }

        .page-title {
          font-size: var(--heading-h1);
          color: var(--color-text);
          margin: 0 0 var(--space-xs) 0;
        }

        .page-subtitle {
          font-size: var(--text-base);
          color: var(--color-text-muted);
          margin: 0;
        }

        .header-stats {
          display: flex;
          gap: var(--space-lg);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--space-sm) var(--space-md);
          background: var(--color-surface);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-md);
        }

        .stat-value {
          font-size: var(--text-xl);
          font-weight: var(--font-bold);
          color: var(--color-primary);
        }

        .stat-label {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Table Styles */
        .users-table {
          width: 100%;
          border-collapse: collapse;
        }

        .users-table th,
        .users-table td {
          padding: var(--space-md);
          text-align: left;
          border-bottom: 1px solid var(--color-border-light);
        }

        .users-table th {
          font-size: var(--text-xs);
          font-weight: var(--font-semibold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
          background: var(--color-bg);
        }

        .users-table tbody tr:hover {
          background: var(--color-border-light);
        }

        .user-email {
          font-weight: var(--font-medium);
          color: var(--color-text);
        }

        .tenant-cell :global(.tenant-link) {
          color: var(--color-primary);
          text-decoration: none;
        }

        .tenant-cell :global(.tenant-link):hover {
          text-decoration: underline;
        }

        .no-tenant {
          color: var(--color-text-light);
        }

        .date-cell {
          color: var(--color-text-muted);
          font-size: var(--text-sm);
          white-space: nowrap;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: var(--space-2xl);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: var(--space-md);
        }

        .empty-title {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-text);
          margin: 0 0 var(--space-sm) 0;
        }

        .empty-text {
          font-size: var(--text-base);
          color: var(--color-text-muted);
          margin: 0;
        }

        @media (max-width: 768px) {
          .users-table th,
          .users-table td {
            padding: var(--space-sm);
            font-size: var(--text-sm);
          }

          .header-stats {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </Section>
  );
}
