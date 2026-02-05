"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Activity, CheckCircle, FileText, Clock, AlertTriangle, RefreshCw, Plus } from 'lucide-react';
import { dashboard, cases, DashboardMetrics, CaseSummary, ApiError } from "../lib/api/client";
import {
  DashboardGrid,
  SectionHeader,
} from "../components/Dashboard/shared";

/**
 * App Dashboard – Übersicht für eingeloggte Benutzer
 *
 * WICHTIG: Dieses Dashboard zeigt AUSSCHLIESSLICH echte Daten aus der API.
 * - Keine Mock-Werte
 * - Keine Fake-KPIs (wie "Gesparte Abgaben")
 * - Nullwerte sind valide Zustände
 *
 * Datenquellen:
 * - /dashboard API für Metriken (case_counts, activity)
 * - /cases API für Fall-Liste
 */
export default function AppDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentCases, setRecentCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: string; requestId?: string | null } | null>(null);
  const [creatingIza, setCreatingIza] = useState(false);

  // Create new IZA case and navigate to wizard
  const handleCreateIza = async () => {
    setCreatingIza(true);
    try {
      const response = await cases.create({ procedure_code: "IZA" });
      router.push(`/app/cases/${response.data.id}/wizard`);
    } catch (err) {
      const apiErr = err as ApiError;
      setError({
        message: apiErr.message || "Fehler beim Erstellen des Falls.",
        code: apiErr.code,
        requestId: apiErr.requestId,
      });
      setCreatingIza(false);
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load cases first - this is less likely to fail
      let casesData: CaseSummary[] = [];
      try {
        const casesRes = await cases.list("active");
        casesData = casesRes.data.slice(0, 5);
      } catch (casesErr) {
        console.error("[Dashboard] Failed to load cases:", casesErr);
        // Continue without cases
      }

      // Load dashboard metrics
      try {
        const dashboardRes = await dashboard.getMetrics();
        setMetrics(dashboardRes.data);
      } catch (dashErr) {
        const apiError = dashErr as ApiError;
        console.error("[Dashboard] Failed to load metrics:", apiError);

        // Set partial error - we still show cases if available
        setError({
          message: apiError.message || "Dashboard-Metriken konnten nicht geladen werden.",
          code: apiError.code,
          requestId: apiError.requestId,
        });
      }

      setRecentCases(casesData);
    } catch (err) {
      const apiError = err as ApiError;
      console.error("[Dashboard] Failed to load data:", apiError);
      setError({
        message: apiError.message || "Daten konnten nicht geladen werden.",
        code: apiError.code,
        requestId: apiError.requestId,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto pb-12">
        <SectionHeader title="Übersicht" />
        <div className="flex items-center justify-center h-64">
          <div className="text-[#6F767E] text-sm">Daten werden geladen...</div>
        </div>
      </div>
    );
  }

  // Error state - but still show partial data if available
  if (error && !metrics && recentCases.length === 0) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto pb-12">
        <SectionHeader title="Übersicht" />
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-6 flex flex-col items-center justify-center">
          <AlertTriangle className="w-12 h-12 text-[#DC2626] mb-4" />
          <h3 className="text-[17px] font-semibold text-[#1A1D1F] mb-2">
            Fehler beim Laden
          </h3>
          <p className="text-[15px] text-[#6F767E] text-center mb-2">
            {error.message}
          </p>
          {error.code && (
            <p className="text-[13px] text-[#9CA3AF] mb-1">
              Fehlercode: {error.code}
            </p>
          )}
          {error.requestId && (
            <p className="text-[13px] text-[#9CA3AF] mb-4">
              Request-ID: {error.requestId}
            </p>
          )}
          <button
            onClick={loadDashboardData}
            className="flex items-center gap-2 px-4 py-2 bg-[#2A85FF] text-white rounded-lg text-[15px] font-semibold hover:bg-[#1A75EF] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  const counts = metrics?.case_counts;
  const activity = metrics?.activity;

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <SectionHeader
        title="Übersicht"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboardData}
              className="text-xs text-[#6F767E] hover:text-[#1A1D1F] px-3 py-1.5 rounded-lg border border-[#EFEFEF] hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Aktualisieren
            </button>
            <button
              onClick={handleCreateIza}
              disabled={creatingIza}
              className="text-sm text-white px-4 py-2 rounded-lg bg-[#2A85FF] hover:bg-[#1A75EF] transition-colors flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {creatingIza ? "Wird erstellt..." : "Neue Zollanmeldung"}
            </button>
          </div>
        }
      />

      {/* Partial Error Banner - shown when metrics failed but cases loaded */}
      {error && (recentCases.length > 0 || metrics) && (
        <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[14px] text-[#92400E]">
              {error.message}
              {error.requestId && (
                <span className="text-[12px] text-[#B45309] ml-2">
                  (Request-ID: {error.requestId})
                </span>
              )}
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            className="text-[13px] text-[#D97706] hover:text-[#B45309] font-semibold"
          >
            Erneut laden
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <DashboardGrid columns={3}>
        {/* In Bearbeitung */}
        <MetricCard
          label="In Bearbeitung"
          value={counts?.in_process ?? 0}
          sublabel={counts?.drafts ? `${counts.drafts} Entwürfe` : null}
          icon={Activity}
          iconBgClass="bg-[#B5E4CA]"
        />

        {/* Vorbereitet */}
        <MetricCard
          label="Vorbereitet"
          value={counts?.prepared ?? 0}
          sublabel={counts?.completed ? `${counts.completed} erledigt` : null}
          icon={CheckCircle}
          iconBgClass="bg-[#CABDFF]"
        />

        {/* Gesamt */}
        <MetricCard
          label="Fälle gesamt"
          value={counts?.total ?? 0}
          sublabel={counts?.archived ? `${counts.archived} archiviert` : null}
          icon={FileText}
          iconBgClass="bg-[#FFBC99]"
        />
      </DashboardGrid>

      {/* Activity + Recent Cases */}
      <DashboardGrid columns={3}>
        {/* Recent Cases (2 columns) */}
        <div className="lg:col-span-2">
          <RecentCasesList cases={recentCases} />
        </div>

        {/* Activity Chart (1 column) */}
        <div className="lg:col-span-1">
          <ActivityChart activity={activity} />
        </div>
      </DashboardGrid>
    </div>
  );
}

// =============================================================================
// Metric Card Component
// =============================================================================

interface MetricCardProps {
  label: string;
  value: number;
  sublabel: string | null;
  icon: React.ElementType;
  iconBgClass: string;
}

function MetricCard({ label, value, sublabel, icon: Icon, iconBgClass }: MetricCardProps) {
  return (
    <div className="flex flex-col p-6 bg-[#FCFCFC] rounded-lg border border-transparent hover:border-[#EFEFEF] transition-all shadow-[0px_1px_2px_rgba(0,0,0,0.05)] h-[180px] w-full">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBgClass}`}>
          <Icon className="w-6 h-6 text-[#1A1D1F]" />
        </div>
      </div>

      <div className="mt-auto">
        <div className="text-[13px] font-semibold text-[#33383F] mb-1">{label}</div>
        <div className="text-[48px] font-semibold text-[#1A1D1F] leading-none tracking-tight">
          {value}
        </div>
        {sublabel && (
          <div className="text-[13px] text-[#6F767E] mt-2">{sublabel}</div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Activity Chart Component (Real Data)
// =============================================================================

interface ActivityChartProps {
  activity: DashboardMetrics["activity"] | undefined;
}

function ActivityChart({ activity }: ActivityChartProps) {
  const days = activity?.days ?? [];
  const hasData = days.length > 0 && days.some(d => d.cases_created > 0 || d.cases_submitted > 0);

  // Berechne max für Skalierung
  const maxValue = Math.max(
    ...days.map(d => Math.max(d.cases_created, d.cases_submitted)),
    1 // Minimum 1 um Division durch 0 zu vermeiden
  );

  // Formatiere Datum zu Wochentag
  const formatDay = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return weekdays[date.getDay()];
  };

  // Letzte Aktivität formatieren
  const formatLastActivity = () => {
    if (!activity?.last_activity_at) return null;
    const date = new Date(activity.last_activity_at);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col p-6 bg-[#FCFCFC] rounded-lg h-[347px] relative w-full shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-[15px] font-bold text-[#1A1D1F]">Aktivität</h3>
          <p className="text-[13px] text-[#6F767E]">Letzte 7 Tage</p>
        </div>
      </div>

      {/* Letzte Aktivität */}
      {activity?.last_activity_at && (
        <div className="flex items-center gap-2 text-[13px] text-[#6F767E] mb-4">
          <Clock className="w-4 h-4" />
          <span>Letzte Aktivität: {formatLastActivity()}</span>
        </div>
      )}

      {!hasData ? (
        // Empty State
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[#9A9FA5] text-sm mb-2">Noch keine Aktivität</div>
            <div className="text-[#6F767E] text-xs">
              Erstellen Sie einen Fall, um Aktivität zu sehen.
            </div>
          </div>
        </div>
      ) : (
        // Chart
        <div className="flex justify-between items-end h-[170px] w-full px-2 mt-auto">
          {days.map((day, i) => {
            const total = day.cases_created + day.cases_submitted;
            const heightPercent = (total / maxValue) * 100;
            const isToday = i === days.length - 1;

            return (
              <div key={day.date} className="flex flex-col items-center gap-3 group relative cursor-pointer w-full">
                {/* Tooltip */}
                <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity bg-[#272B30] text-white text-xs py-2 px-3 rounded shadow-lg whitespace-nowrap z-10 pointer-events-none">
                  <div>{day.cases_created} erstellt</div>
                  <div>{day.cases_submitted} eingereicht</div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#272B30]"></div>
                </div>

                {/* Bar */}
                <div
                  className={`w-8 rounded-sm transition-all duration-300 ${
                    isToday ? 'bg-[#2A85FF]' : 'bg-[#B5E4CA] opacity-80 group-hover:opacity-100'
                  }`}
                  style={{ height: `${Math.max(heightPercent * 1.5, 4)}px` }}
                />

                {/* Label */}
                <span className="text-[13px] font-semibold text-[#6F767E]">
                  {formatDay(day.date)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Recent Cases List Component (Real Data)
// =============================================================================

interface RecentCasesListProps {
  cases: CaseSummary[];
}

function RecentCasesList({ cases }: RecentCasesListProps) {
  // Status Badge Component
  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      DRAFT: { label: "Entwurf", bgClass: "bg-[#F4F4F4]", textClass: "text-[#6F767E]" },
      IN_PROCESS: { label: "In Bearbeitung", bgClass: "bg-[#B5E4CA]", textClass: "text-[#1A1D1F]" },
      PREPARED: { label: "Vorbereitet", bgClass: "bg-[#CABDFF]", textClass: "text-[#1A1D1F]" },
      COMPLETED: { label: "Erledigt", bgClass: "bg-[#E5E5E5]", textClass: "text-[#6F767E]" },
      ARCHIVED: { label: "Archiviert", bgClass: "bg-[#F4F4F4]", textClass: "text-[#6F767E]" },
    }[status] ?? { label: status, bgClass: "bg-[#F4F4F4]", textClass: "text-[#6F767E]" };

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${config.bgClass} ${config.textClass}`}>
        {config.label}
      </span>
    );
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-[#FCFCFC] rounded-lg p-6 w-full shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[15px] font-bold text-[#1A1D1F]">Aktuelle Fälle</h3>
        <a
          href="/app/cases"
          className="text-[13px] text-[#2A85FF] hover:underline font-semibold"
        >
          Alle anzeigen
        </a>
      </div>

      {cases.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="w-12 h-12 text-[#EFEFEF] mb-4" />
          <div className="text-[#9A9FA5] text-sm mb-2">Noch keine Fälle</div>
          <a
            href="/app/cases"
            className="text-[13px] text-[#2A85FF] hover:underline font-semibold"
          >
            Ersten Fall erstellen
          </a>
        </div>
      ) : (
        // Cases List
        <div className="flex flex-col gap-3">
          {cases.map((caseItem) => (
            <a
              key={caseItem.id}
              href={`/app/cases/${caseItem.id}`}
              className="flex items-center justify-between p-4 hover:bg-[#F4F4F4] rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#F4F4F4] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#6F767E]" />
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-[#1A1D1F] group-hover:text-[#2A85FF] transition-colors">
                    {caseItem.title}
                  </div>
                  <div className="text-[13px] text-[#6F767E]">
                    {formatDate(caseItem.created_at)}
                  </div>
                </div>
              </div>
              <StatusBadge status={caseItem.status} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
