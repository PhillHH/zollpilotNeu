# Dashboard-Kennzahlen

## Überblick

Das ZollPilot-Dashboard zeigt **ausschließlich Prozess- und Statusmetriken** an.
Es werden **keine monetären Werte** oder Optimierungsmetriken dargestellt.

**Wichtig:**
- ZollPilot optimiert keine Abgaben
- ZollPilot leistet keine Rechts- oder Zollberatung
- Das Dashboard darf keine finanziellen Vorteile suggerieren

---

## Kennzahlen im Detail

### 1. Anzahl Entwürfe (`drafts`)

| Eigenschaft | Beschreibung |
|-------------|--------------|
| **Was wird gemessen** | Anzahl der Fälle mit Status `DRAFT` (ohne Verfahrensbindung) |
| **Was wird NICHT gemessen** | Qualität oder Vollständigkeit |
| **Datenquelle** | `COUNT(*) FROM Case WHERE tenant_id = ? AND status = 'DRAFT'` |
| **Rechtliche Unbedenklichkeit** | Reine Statusstatistik ohne inhaltliche Bewertung |
| **Gültiger Wertebereich** | `>= 0` (Nullwert ist valide) |

---

### 2. Anzahl in Bearbeitung (`in_process`)

| Eigenschaft | Beschreibung |
|-------------|--------------|
| **Was wird gemessen** | Anzahl der Fälle mit Status `IN_PROCESS` (Verfahren gewählt, Bearbeitung läuft) |
| **Was wird NICHT gemessen** | Fortschritt innerhalb des Verfahrens |
| **Datenquelle** | `COUNT(*) FROM Case WHERE tenant_id = ? AND status = 'IN_PROCESS'` |
| **Rechtliche Unbedenklichkeit** | Reine Statusstatistik ohne inhaltliche Bewertung |
| **Gültiger Wertebereich** | `>= 0` (Nullwert ist valide) |

---

### 4. Anzahl eingereichte Anmeldungen (`submitted`)

| Eigenschaft | Beschreibung |
|-------------|--------------|
| **Was wird gemessen** | Anzahl der Fälle mit Status `SUBMITTED` |
| **Was wird NICHT gemessen** | Ob Anmeldungen akzeptiert/abgelehnt wurden, keine Erfolgsbewertung |
| **Datenquelle** | `COUNT(*) FROM Case WHERE tenant_id = ? AND status = 'SUBMITTED'` |
| **Rechtliche Unbedenklichkeit** | Reine Statusstatistik, keine Aussage über Erfolg oder Ergebnis |
| **Gültiger Wertebereich** | `>= 0` (Nullwert ist valide) |

---

### 5. Anzahl archivierte Fälle (`archived`)

| Eigenschaft | Beschreibung |
|-------------|--------------|
| **Was wird gemessen** | Anzahl der Fälle mit Status `ARCHIVED` |
| **Was wird NICHT gemessen** | Grund der Archivierung, keine qualitative Bewertung |
| **Datenquelle** | `COUNT(*) FROM Case WHERE tenant_id = ? AND status = 'ARCHIVED'` |
| **Rechtliche Unbedenklichkeit** | Reine Statusstatistik, archiviert bedeutet nur "abgelegt" |
| **Gültiger Wertebereich** | `>= 0` (Nullwert ist valide) |

---

### 6. Gesamtanzahl Fälle (`total`)

| Eigenschaft | Beschreibung |
|-------------|--------------|
| **Was wird gemessen** | Summe aus `drafts + in_process + submitted + archived` |
| **Was wird NICHT gemessen** | Keine Bewertung der Fälle |
| **Datenquelle** | Berechnet aus den vier Status-Zählern |
| **Rechtliche Unbedenklichkeit** | Aggregierte Summe ohne inhaltliche Aussage |
| **Gültiger Wertebereich** | `>= 0` (Nullwert ist valide) |

---

### 7. Letzte Aktivität (`last_activity_at`)

| Eigenschaft | Beschreibung |
|-------------|--------------|
| **Was wird gemessen** | Zeitstempel der letzten Änderung (neuestes `updated_at`) |
| **Was wird NICHT gemessen** | Art der Änderung, keine Inhaltsanalyse |
| **Datenquelle** | `SELECT MAX(updated_at) FROM Case WHERE tenant_id = ?` |
| **Rechtliche Unbedenklichkeit** | Reiner Zeitstempel ohne Bewertung |
| **Gültiger Wertebereich** | `datetime | null` (null wenn keine Fälle existieren) |

---

### 8. Tägliche Aktivität (`days`)

| Eigenschaft | Beschreibung |
|-------------|--------------|
| **Was wird gemessen** | Anzahl erstellter und eingereichter Fälle pro Tag (letzte 7 Tage) |
| **Was wird NICHT gemessen** | Qualität oder Inhalt der Fälle |
| **Datenquelle** | Aggregation nach `created_at` und `submitted_at` pro Tag |
| **Rechtliche Unbedenklichkeit** | Reine Aktivitätsstatistik ohne inhaltliche Bewertung |
| **Gültiger Wertebereich** | Array mit 7 Einträgen, jeder Zähler `>= 0` |

**Struktur pro Tag:**
```json
{
  "date": "2024-01-15",
  "cases_created": 0,
  "cases_submitted": 0
}
```

---

## API-Endpoint

**Route:** `GET /dashboard`

**Authentifizierung:** Erforderlich (Session-basiert)

**Response-Schema:**
```json
{
  "data": {
    "case_counts": {
      "drafts": 0,
      "in_process": 0,
      "submitted": 0,
      "archived": 0,
      "total": 0
    },
    "activity": {
      "last_activity_at": null,
      "days": [
        {
          "date": "2024-01-09",
          "cases_created": 0,
          "cases_submitted": 0
        }
      ]
    }
  }
}
```

---

## Beispiel-Responses

### Komplett leerer Zustand (neuer Mandant)

```json
{
  "data": {
    "case_counts": {
      "drafts": 0,
      "in_process": 0,
      "submitted": 0,
      "archived": 0,
      "total": 0
    },
    "activity": {
      "last_activity_at": null,
      "days": [
        {"date": "2024-01-09", "cases_created": 0, "cases_submitted": 0},
        {"date": "2024-01-10", "cases_created": 0, "cases_submitted": 0},
        {"date": "2024-01-11", "cases_created": 0, "cases_submitted": 0},
        {"date": "2024-01-12", "cases_created": 0, "cases_submitted": 0},
        {"date": "2024-01-13", "cases_created": 0, "cases_submitted": 0},
        {"date": "2024-01-14", "cases_created": 0, "cases_submitted": 0},
        {"date": "2024-01-15", "cases_created": 0, "cases_submitted": 0}
      ]
    }
  }
}
```

### Minimal befüllter Zustand

```json
{
  "data": {
    "case_counts": {
      "drafts": 0,
      "in_process": 1,
      "submitted": 0,
      "archived": 0,
      "total": 1
    },
    "activity": {
      "last_activity_at": "2024-01-15T14:30:00Z",
      "days": [
        {"date": "2024-01-09", "cases_created": 0, "cases_submitted": 0},
        {"date": "2024-01-10", "cases_created": 0, "cases_submitted": 0},
        {"date": "2024-01-11", "cases_created": 0, "cases_submitted": 0},
        {"date": "2024-01-12", "cases_created": 0, "cases_submitted": 0},
        {"date": "2024-01-13", "cases_created": 0, "cases_submitted": 0},
        {"date": "2024-01-14", "cases_created": 0, "cases_submitted": 0},
        {"date": "2024-01-15", "cases_created": 1, "cases_submitted": 0}
      ]
    }
  }
}
```

### Aktiver Zustand

```json
{
  "data": {
    "case_counts": {
      "drafts": 1,
      "in_process": 3,
      "submitted": 5,
      "archived": 2,
      "total": 11
    },
    "activity": {
      "last_activity_at": "2024-01-15T16:45:00Z",
      "days": [
        {"date": "2024-01-09", "cases_created": 1, "cases_submitted": 0},
        {"date": "2024-01-10", "cases_created": 0, "cases_submitted": 1},
        {"date": "2024-01-11", "cases_created": 2, "cases_submitted": 1},
        {"date": "2024-01-12", "cases_created": 0, "cases_submitted": 0},
        {"date": "2024-01-13", "cases_created": 1, "cases_submitted": 2},
        {"date": "2024-01-14", "cases_created": 0, "cases_submitted": 1},
        {"date": "2024-01-15", "cases_created": 1, "cases_submitted": 0}
      ]
    }
  }
}
```

---

## Was explizit NICHT gemessen wird

Die folgenden Metriken wurden bewusst **nicht** implementiert:

| Metrik | Grund |
|--------|-------|
| "Gesparte Abgaben" | Suggeriert finanzielle Vorteile; ZollPilot optimiert keine Abgaben |
| "Optimierungspotenzial" | Impliziert Beratung; ZollPilot leistet keine Zollberatung |
| "Erfolgreich/Abgelehnt" | Erfordert Rückmeldung vom Zoll; nicht im Scope |
| "Durchschnittlicher Warenwert" | Finanzielle Metrik ohne Mehrwert für Prozessübersicht |
| "Zeitersparnis" | Werbliche Metrik; nicht objektiv messbar |

---

## Zielgruppen

- **Entwickler:** Datenverträge und API-Struktur verstehen
- **Produktverantwortliche:** Fachliche Korrektheit und rechtliche Konformität prüfen
- **QA:** Testfälle für valide und leere Zustände ableiten
