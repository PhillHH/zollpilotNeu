"""
Dashboard API Route - Fachlich korrekte Prozess- und Statusmetriken.

WICHTIG:
- Keine monetären Metriken ("gesparte Abgaben" etc.)
- Keine impliziten Beratungssignale
- ZollPilot leistet keine Rechts- oder Zollberatung

Alle Kennzahlen bilden ausschließlich Systemzustände ab.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.dependencies.auth import AuthContext, get_current_user
from app.db.prisma_client import prisma

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


# =============================================================================
# DTOs / Response-Strukturen
# =============================================================================


class CaseStatusCounts(BaseModel):
    """Anzahl der Fälle nach Status.

    Fachliche Bedeutung:
    - drafts: Neue Fälle ohne Verfahrensbindung
    - in_process: Fälle in Bearbeitung (Verfahren gewählt)
    - submitted: Erfolgreich eingereichte Anmeldungen
    - archived: Abgeschlossene/archivierte Fälle
    - total: Gesamtanzahl aller Fälle des Mandanten
    """
    drafts: int = Field(
        description="Anzahl Fälle im Status DRAFT (ohne Verfahren)",
        ge=0
    )
    in_process: int = Field(
        description="Anzahl Fälle im Status IN_PROCESS (in Bearbeitung)",
        ge=0
    )
    submitted: int = Field(
        description="Anzahl Fälle im Status SUBMITTED (eingereicht)",
        ge=0
    )
    archived: int = Field(
        description="Anzahl Fälle im Status ARCHIVED (archiviert)",
        ge=0
    )
    total: int = Field(
        description="Gesamtanzahl aller Fälle",
        ge=0
    )


class DailyActivity(BaseModel):
    """Aktivität für einen einzelnen Tag.

    Fachliche Bedeutung:
    - Misst die Anzahl erstellter Fälle pro Tag
    - Nullwerte sind valide und erwünscht
    """
    date: str = Field(
        description="Datum im Format YYYY-MM-DD"
    )
    cases_created: int = Field(
        description="Anzahl an diesem Tag erstellter Fälle",
        ge=0
    )
    cases_submitted: int = Field(
        description="Anzahl an diesem Tag eingereichter Fälle",
        ge=0
    )


class ActivitySummary(BaseModel):
    """Aktivitätsübersicht für einen Zeitraum.

    Fachliche Bedeutung:
    - Gibt Überblick über Nutzungsaktivität
    - last_activity_at kann None sein, wenn noch keine Fälle existieren
    """
    last_activity_at: Optional[datetime] = Field(
        default=None,
        description="Zeitpunkt der letzten Aktivität (letztes updated_at eines Falls)"
    )
    days: list[DailyActivity] = Field(
        description="Tägliche Aktivität (letzte 7 Tage)"
    )


class DashboardMetrics(BaseModel):
    """Vollständige Dashboard-Metriken.

    WICHTIG: Enthält ausschließlich Prozess- und Statusmetriken.
    Keine monetären Werte, keine Optimierungsmetriken.

    Was diese Kennzahlen NICHT messen:
    - Keine finanziellen Vorteile/Ersparnisse
    - Keine Zollabgaben-Berechnungen
    - Keine Empfehlungen oder Beratungssignale
    """
    case_counts: CaseStatusCounts = Field(
        description="Anzahl Fälle nach Status"
    )
    activity: ActivitySummary = Field(
        description="Aktivitätsübersicht"
    )


class DashboardResponse(BaseModel):
    """API-Response für Dashboard-Metriken."""
    data: DashboardMetrics


# =============================================================================
# API Endpoints
# =============================================================================


@router.get("", response_model=DashboardResponse)
async def get_dashboard_metrics(
    context: AuthContext = Depends(get_current_user),
) -> DashboardResponse:
    """
    Liefert die Dashboard-Metriken für den aktuellen Mandanten.

    Alle Metriken basieren auf echten Daten aus der Datenbank.
    Nullwerte (0, [], None) sind valide Rückgabewerte.

    Returns:
        DashboardResponse: Fachlich korrekte Prozess- und Statusmetriken
    """
    # Defensive: context.tenant might be None or missing "id"
    tenant_id = context.tenant.get("id") if context.tenant else None

    if not tenant_id:
        # Return empty metrics if no tenant (shouldn't happen with proper auth, but safety first)
        return DashboardResponse(
            data=DashboardMetrics(
                case_counts=CaseStatusCounts(
                    drafts=0,
                    in_process=0,
                    submitted=0,
                    archived=0,
                    total=0,
                ),
                activity=ActivitySummary(
                    last_activity_at=None,
                    days=[],
                ),
            )
        )

    try:
        # Status-Aggregationen parallel ausführen
        drafts_count, in_process_count, submitted_count, archived_count = await _count_cases_by_status(tenant_id)

        # Aktivitätsdaten
        last_activity = await _get_last_activity(tenant_id)
        daily_activity = await _get_daily_activity(tenant_id, days=7)

        total = drafts_count + in_process_count + submitted_count + archived_count

        return DashboardResponse(
            data=DashboardMetrics(
                case_counts=CaseStatusCounts(
                    drafts=drafts_count,
                    in_process=in_process_count,
                    submitted=submitted_count,
                    archived=archived_count,
                    total=total,
                ),
                activity=ActivitySummary(
                    last_activity_at=last_activity,
                    days=daily_activity,
                ),
            )
        )
    except Exception as e:
        logger.exception(f"Error fetching dashboard metrics for tenant {tenant_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "DASHBOARD_METRICS_ERROR",
                "message": f"Failed to load dashboard metrics: {str(e)}",
            },
        )


# =============================================================================
# Interne Aggregationsfunktionen
# =============================================================================


async def _count_cases_by_status(tenant_id: str) -> tuple[int, int, int, int]:
    """Zählt Fälle nach Status für einen Mandanten.

    Returns:
        tuple: (drafts, in_process, submitted, archived)
    """
    drafts = await prisma.case.count(
        where={"tenant_id": tenant_id, "status": "DRAFT"}
    )
    in_process = await prisma.case.count(
        where={"tenant_id": tenant_id, "status": "IN_PROCESS"}
    )
    submitted = await prisma.case.count(
        where={"tenant_id": tenant_id, "status": "SUBMITTED"}
    )
    archived = await prisma.case.count(
        where={"tenant_id": tenant_id, "status": "ARCHIVED"}
    )
    return drafts, in_process, submitted, archived


async def _get_last_activity(tenant_id: str) -> Optional[datetime]:
    """Ermittelt den Zeitpunkt der letzten Aktivität.

    Basiert auf dem neuesten updated_at aller Fälle des Mandanten.

    Returns:
        datetime | None: Zeitpunkt oder None wenn keine Fälle existieren
    """
    latest_case = await prisma.case.find_first(
        where={"tenant_id": tenant_id},
        order={"updated_at": "desc"},
    )
    return latest_case.updated_at if latest_case else None


async def _get_daily_activity(tenant_id: str, days: int = 7) -> list[DailyActivity]:
    """Ermittelt die tägliche Aktivität der letzten N Tage.

    Zählt:
    - cases_created: Fälle, deren created_at an diesem Tag liegt
    - cases_submitted: Fälle, deren submitted_at an diesem Tag liegt

    Returns:
        list[DailyActivity]: Liste mit Aktivitäten pro Tag (ältester zuerst)
    """
    today = datetime.utcnow().date()
    result: list[DailyActivity] = []

    for i in range(days - 1, -1, -1):  # Von vor 6 Tagen bis heute
        day = today - timedelta(days=i)
        day_start = datetime(day.year, day.month, day.day, 0, 0, 0)
        day_end = datetime(day.year, day.month, day.day, 23, 59, 59, 999999)

        # Erstellte Fälle an diesem Tag
        created = await prisma.case.count(
            where={
                "tenant_id": tenant_id,
                "created_at": {"gte": day_start, "lte": day_end},
            }
        )

        # Eingereichte Fälle an diesem Tag
        submitted = await prisma.case.count(
            where={
                "tenant_id": tenant_id,
                "submitted_at": {"gte": day_start, "lte": day_end},
            }
        )

        result.append(
            DailyActivity(
                date=day.isoformat(),
                cases_created=created,
                cases_submitted=submitted,
            )
        )

    return result
