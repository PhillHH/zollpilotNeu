"use client";

import { Section } from "../../design-system/primitives/Section";
import { Card } from "../../design-system/primitives/Card";
import { Badge } from "../../design-system/primitives/Badge";
import { Settings, Server, Database, Shield, Globe } from "lucide-react";

/**
 * Settings Client – System-Einstellungen
 */
export function SettingsClient() {
  return (
    <Section maxWidth="xl" padding="xl">
      {/* Header */}
      <header className="settings-header">
        <div className="header-text">
          <h1 className="page-title">System-Einstellungen</h1>
          <p className="page-subtitle">
            Systemkonfiguration und Übersicht
          </p>
        </div>
      </header>

      {/* System Info Grid */}
      <div className="settings-grid">
        <Card padding="lg">
          <div className="setting-item">
            <div className="setting-icon">
              <Server size={24} />
            </div>
            <div className="setting-content">
              <h3 className="setting-title">Systemversion</h3>
              <p className="setting-value">v2.4.0</p>
              <Badge variant="success">Aktuell</Badge>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="setting-item">
            <div className="setting-icon">
              <Database size={24} />
            </div>
            <div className="setting-content">
              <h3 className="setting-title">Datenbank</h3>
              <p className="setting-value">PostgreSQL</p>
              <Badge variant="success">Verbunden</Badge>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="setting-item">
            <div className="setting-icon">
              <Shield size={24} />
            </div>
            <div className="setting-content">
              <h3 className="setting-title">Sicherheit</h3>
              <p className="setting-value">JWT Auth</p>
              <Badge variant="success">Aktiv</Badge>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="setting-item">
            <div className="setting-icon">
              <Globe size={24} />
            </div>
            <div className="setting-content">
              <h3 className="setting-title">Umgebung</h3>
              <p className="setting-value">{process.env.NODE_ENV || "development"}</p>
              <Badge variant="info">
                {process.env.NODE_ENV === "production" ? "Produktion" : "Entwicklung"}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Placeholder for future settings */}
      <Card title="Erweiterte Einstellungen" padding="lg" className="coming-soon-card">
        <div className="coming-soon">
          <Settings size={48} className="coming-soon-icon" />
          <h3>Demnächst verfügbar</h3>
          <p>
            Erweiterte Konfigurationsoptionen werden in einem zukünftigen Update hinzugefügt.
          </p>
        </div>
      </Card>

      <style jsx>{`
        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-xl);
          gap: var(--space-md);
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

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
        }

        .setting-item {
          display: flex;
          gap: var(--space-md);
          align-items: flex-start;
        }

        .setting-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background: var(--color-border-light);
          color: var(--color-text-muted);
          flex-shrink: 0;
        }

        .setting-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .setting-title {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-muted);
          margin: 0;
        }

        .setting-value {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-text);
          margin: 0;
        }

        :global(.coming-soon-card) {
          margin-top: var(--space-lg);
        }

        .coming-soon {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-2xl);
          text-align: center;
          color: var(--color-text-muted);
        }

        .coming-soon :global(.coming-soon-icon) {
          margin-bottom: var(--space-md);
          opacity: 0.5;
        }

        .coming-soon h3 {
          margin: 0 0 var(--space-sm) 0;
          color: var(--color-text);
        }

        .coming-soon p {
          margin: 0;
          max-width: 400px;
        }

        @media (max-width: 768px) {
          .settings-header {
            flex-direction: column;
          }

          .settings-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Section>
  );
}
