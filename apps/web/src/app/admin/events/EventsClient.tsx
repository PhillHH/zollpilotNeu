"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Section } from "../../design-system/primitives/Section";
import { Card } from "../../design-system/primitives/Card";
import { Button } from "../../design-system/primitives/Button";
import { Badge } from "../../design-system/primitives/Badge";
import { Alert } from "../../design-system/primitives/Alert";
import { admin, type EventListItem, type UserSummary, type TenantSummary } from "../../lib/api/client";

const EVENT_TYPES = [
  "REGISTERED",
  "LOGIN",
  "LOGOUT",
  "PASSWORD_RESET",
  "STATUS_CHANGED",
  "PURCHASE",
  "CREDIT_USED",
  "PLAN_CHANGED",
];

/**
 * Events Client – Aktivitäts-Historie im Admin-Bereich
 */
export function EventsClient() {
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterUserId, setFilterUserId] = useState("");
  const [filterTenantId, setFilterTenantId] = useState("");
  const [filterEventType, setFilterEventType] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, usersRes, tenantsRes] = await Promise.all([
        admin.events.list({
          user_id: filterUserId || undefined,
          tenant_id: filterTenantId || undefined,
          event_type: filterEventType || undefined,
          page,
          page_size: pageSize,
        }),
        admin.users.list(),
        admin.tenants.list(),
      ]);

      setEvents(eventsRes.data);
      setTotal(eventsRes.total);
      setUsers(usersRes.data);
      setTenants(tenantsRes.data);
    } catch {
      setError("Events konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [filterUserId, filterTenantId, filterEventType, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilter = () => {
    setPage(1);
    loadData();
  };

  const handleClearFilters = () => {
    setFilterUserId("");
    setFilterTenantId("");
    setFilterEventType("");
    setPage(1);
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getEventLabel = (type: string): string => {
    switch (type) {
      case "REGISTERED": return "Registrierung";
      case "LOGIN": return "Login";
      case "LOGOUT": return "Logout";
      case "PASSWORD_RESET": return "Passwort-Reset";
      case "STATUS_CHANGED": return "Status geändert";
      case "PURCHASE": return "Kauf";
      case "CREDIT_USED": return "Credit verwendet";
      case "PLAN_CHANGED": return "Tarif geändert";
      default: return type;
    }
  };

  const getEventVariant = (type: string): "success" | "info" | "warning" | "danger" | "default" => {
    switch (type) {
      case "REGISTERED": return "success";
      case "LOGIN": return "info";
      case "LOGOUT": return "default";
      case "PASSWORD_RESET": return "warning";
      case "STATUS_CHANGED": return "warning";
      case "PURCHASE": return "success";
      case "CREDIT_USED": return "info";
      case "PLAN_CHANGED": return "info";
      default: return "default";
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Section maxWidth="xl" padding="xl">
      {/* Header */}
      <header className="events-header">
        <div className="header-text">
          <h1 className="page-title">Aktivitäts-Historie</h1>
          <p className="page-subtitle">
            Alle Ereignisse im System ({total} Einträge)
          </p>
        </div>
      </header>

      {/* Error */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card padding="md">
        <div className="filters-grid">
          <div className="filter-field">
            <label htmlFor="user-filter" className="filter-label">Nutzer</label>
            <select
              id="user-filter"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="filter-select"
            >
              <option value="">Alle Nutzer</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.email}</option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="tenant-filter" className="filter-label">Mandant</label>
            <select
              id="tenant-filter"
              value={filterTenantId}
              onChange={(e) => setFilterTenantId(e.target.value)}
              className="filter-select"
            >
              <option value="">Alle Mandanten</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="type-filter" className="filter-label">Event-Typ</label>
            <select
              id="type-filter"
              value={filterEventType}
              onChange={(e) => setFilterEventType(e.target.value)}
              className="filter-select"
            >
              <option value="">Alle Typen</option>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>{getEventLabel(type)}</option>
              ))}
            </select>
          </div>

          <div className="filter-actions">
            <Button variant="primary" size="sm" onClick={handleFilter}>
              Filtern
            </Button>
            <Button variant="secondary" size="sm" onClick={handleClearFilters}>
              Zurücksetzen
            </Button>
          </div>
        </div>
      </Card>

      {/* Events Table */}
      {loading ? (
        <div className="loading-state">
          <p>Events werden geladen...</p>
        </div>
      ) : events.length === 0 ? (
        <Card padding="lg">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3 className="empty-title">Keine Events gefunden</h3>
            <p className="empty-text">
              Mit den aktuellen Filtern wurden keine Events gefunden.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Card padding="none">
            <table className="events-table">
              <thead>
                <tr>
                  <th>Zeitpunkt</th>
                  <th>Ereignis</th>
                  <th>Nutzer</th>
                  <th>Mandant</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="date-cell">{formatDateTime(event.created_at)}</td>
                    <td>
                      <Badge variant={getEventVariant(event.type)} size="sm">
                        {getEventLabel(event.type)}
                      </Badge>
                    </td>
                    <td>
                      <Link href={`/admin/users/${event.user_id}`} className="user-link">
                        {event.user_email}
                      </Link>
                    </td>
                    <td className="tenant-cell">
                      {event.tenant_name ? (
                        <Link href={`/admin/tenants/${event.tenant_id}`} className="tenant-link">
                          {event.tenant_name}
                        </Link>
                      ) : (
                        <span className="no-tenant">—</span>
                      )}
                    </td>
                    <td className="details-cell">
                      {formatEventMetadata(event)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Zurück
              </Button>
              <span className="page-info">
                Seite {page} von {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Weiter
              </Button>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .events-header {
          margin-bottom: var(--space-xl);
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

        /* Filters */
        .filters-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-md);
          align-items: end;
        }

        .filter-field {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .filter-label {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text);
        }

        .filter-select {
          padding: var(--space-sm) var(--space-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          background: var(--color-surface);
          color: var(--color-text);
        }

        .filter-actions {
          display: flex;
          gap: var(--space-sm);
        }

        /* Loading */
        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          color: var(--color-text-muted);
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

        /* Table */
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

        .events-table tbody tr:hover {
          background: var(--color-border-light);
        }

        .date-cell {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          white-space: nowrap;
        }

        :global(.user-link),
        :global(.tenant-link) {
          color: var(--color-primary);
          text-decoration: none;
        }

        :global(.user-link):hover,
        :global(.tenant-link):hover {
          text-decoration: underline;
        }

        .no-tenant {
          color: var(--color-text-light);
        }

        .details-cell {
          font-size: var(--text-sm);
          color: var(--color-text-light);
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Pagination */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-md);
          margin-top: var(--space-lg);
        }

        .page-info {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        @media (max-width: 768px) {
          .filters-grid {
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
function formatEventMetadata(event: EventListItem): string {
  if (!event.metadata_json) return "—";

  const meta = event.metadata_json as Record<string, unknown>;

  if (meta.migrated) return "Aus Migration";
  if (meta.source) return `Quelle: ${meta.source}`;
  if (meta.ip) return `IP: ${meta.ip}`;
  if (meta.old_status && meta.new_status) {
    return `${meta.old_status} → ${meta.new_status}`;
  }
  if (meta.amount) return `Betrag: ${meta.amount}`;
  if (meta.plan_code) return `Tarif: ${meta.plan_code}`;

  return "—";
}
