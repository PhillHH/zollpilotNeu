# Dashboard Frontend – Echte Daten

## Überblick

Das User-Dashboard zeigt **ausschließlich echte Daten** aus der `/dashboard` API.

**Keine Mock-Werte. Keine Fake-KPIs. Keine Interpretation.**

---

## Was das Dashboard zeigt

| Metrik | API-Quelle | Bedeutung |
|--------|------------|-----------|
| **In Bearbeitung** | `case_counts.in_process` | Fälle mit gebundenem Verfahren |
| **Entwürfe** | `case_counts.drafts` | Fälle ohne Verfahren |
| **Eingereicht** | `case_counts.submitted` | Abgegebene Fälle |
| **Fälle gesamt** | `case_counts.total` | Summe aller Fälle |
| **Archiviert** | `case_counts.archived` | Abgeschlossene Fälle |
| **Aktivität (7 Tage)** | `activity.days[]` | Tägliche Erstellungen/Einreichungen |
| **Letzte Aktivität** | `activity.last_activity_at` | Zeitpunkt der letzten Änderung |
| **Aktuelle Fälle** | `/cases?status=active` | Liste der 5 neuesten Fälle |

---

## Was das Dashboard NICHT zeigt

Diese Elemente wurden **bewusst entfernt**:

| Entfernt | Begründung |
|----------|------------|
| **"Gesparte Abgaben"** | Keine Datenbasis, fachlich irreführend |
| **Trend-Prozente** | Keine historischen Vergleichsdaten vorhanden |
| **Sparkline-Charts** | Keine echten Zeitreihen implementiert |
| **Fake-Fallnamen** | Ersetzt durch echte Case-Daten |
| **Hardcodierte Zahlen** | Ersetzt durch API-Daten |

---

## Warum das Dashboard jetzt "ehrlich" ist

### Vorher (Mock-Daten)

```tsx
// ❌ Hardcodierte Fake-Werte
<OverviewCard
  label="Offene Fälle"
  value="12"           // ← Fake
  trend="2 neue"       // ← Fake
/>
<OverviewCard
  label="Gesparte Abgaben"
  value="64k €"        // ← Fake, fachlich falsch
/>
```

### Nachher (Echte Daten)

```tsx
// ✅ Echte API-Daten
<MetricCard
  label="In Bearbeitung"
  value={counts?.in_process ?? 0}  // ← Echt
  sublabel={counts?.drafts ? `${counts.drafts} Entwürfe` : null}
/>
```

---

## Null- und Leerzustände

Das Dashboard behandelt Null-Werte korrekt:

| Zustand | Darstellung |
|---------|-------------|
| 0 Fälle | Zeigt `0` (kein Fehler) |
| Keine Aktivität | "Noch keine Aktivität" |
| Keine Fälle | "Noch keine Fälle" + Link |
| `last_activity_at = null` | Abschnitt wird ausgeblendet |

**Nullwerte sind valide Systemzustände, keine Fehler.**

---

## Datenaktualisierung

Das Dashboard aktualisiert sich bei:

1. **Seitenlade** – Daten werden bei jedem Mount geladen
2. **Manuelle Aktualisierung** – "Aktualisieren" Button
3. **Navigation zurück** – React-Komponente wird neu gemountet

### Code

```tsx
useEffect(() => {
  loadDashboardData();
}, [loadDashboardData]);
```

Nach Case-Events (Erstellen, Submit, Archivieren) navigiert der User
typischerweise zur Dashboard-Seite zurück, wodurch die Daten automatisch
neu geladen werden.

---

## API-Endpunkte

| Endpunkt | Zweck |
|----------|-------|
| `GET /dashboard` | Metriken (case_counts, activity) |
| `GET /cases?status=active` | Aktuelle Fall-Liste |

---

## Datei-Struktur

```
apps/web/src/app/app/page.tsx   ← Dashboard-Seite (echte Daten)
apps/api/app/routes/dashboard.py ← Backend-API
```

Die alten Mock-Komponenten (`ActivityChart.tsx`, `CaseList.tsx`, `OverviewCard.tsx`)
sind nicht mehr in Verwendung – die Logik wurde inline in `page.tsx` neu
implementiert mit echten API-Daten.

---

## Zielgruppen

- **Frontend-Entwickler:** API-Integration, State-Handling
- **Produktverantwortliche:** Welche Metriken sichtbar sind
- **QA:** Testen von Null-Zuständen und Datenaktualisierung
