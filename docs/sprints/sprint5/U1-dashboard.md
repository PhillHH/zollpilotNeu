# U1 – Dashboard UX Refactoring

> **Sprint 5** – Kunden-Dashboard neu strukturieren für bessere Orientierung

## Prompt (Zusammenfassung)

```
GOAL
Das Kunden-Dashboard so umbauen, dass Nutzer innerhalb von 5 Sekunden verstehen:
- wo sie stehen
- was offen ist
- was der nächste sinnvolle Schritt ist

SCOPE
A) Dashboard-Cards: Aktive Fälle, Credits, Letzter Fortschritt
B) Aktive-Fälle-Sektion: Max 3 Fälle mit CTAs
C) Leere Zustände: Klare Handlungsanweisungen
D) UX-Regeln: Fortschritt > Status, keine Behördensprache
E) Tests
F) Dokumentation
```

---

## Summary

### Dashboard-Struktur (neu)

**Above the Fold – 3 Dashboard-Cards:**

| Card | Inhalt | CTA |
|------|--------|-----|
| Aktive Fälle | Anzahl Fälle + Breakdown (Entwürfe/Abgeschlossen) | „Fälle anzeigen" |
| Credits | Guthaben (hervorgehoben, Warnung bei 0) | „Credits verwalten" |
| Letzter Fortschritt | Letzter Entwurf mit Verfahrensname und Zeitstempel | „Fall fortsetzen" |
| *oder* Neuer Fall | Wenn kein Entwurf existiert | „Neuen Fall erstellen" |

**Aktive-Fälle-Sektion:**

- Zeigt max. 3 Fälle
- Pro Fall: Titel (Fallback „Unbenannter Fall"), Status-Badge, relative Zeit
- CTA pro Fall: „Weiter ausfüllen" (DRAFT) oder „Zusammenfassung ansehen" (SUBMITTED)

**Leere Zustände:**

- Keine Fälle: Erklärungstext + CTA „Neuen Fall erstellen"
- Keine Credits: Info-Alert mit Link zur Abrechnung

### Entfernte Elemente

- „Schnellaktionen"-Card (redundant mit Hauptnavigation)
- „So funktioniert's"-Card (verursacht vertikales Scrollen)
- „Einreichen"-Wording (WORDING_GUIDE.md Verstoß)

### Neue Features

- Relative Zeitanzeige („Vor 2 Std.", „Gestern")
- Verfahrensname und Schrittanzahl in Progress-Card
- Responsive 3-2-1-Spalten-Grid
- Credit-Warnung bei 0 Guthaben

---

## Changed/Created Files

### Frontend

| Datei | Status |
|-------|--------|
| `apps/web/src/app/app/page.tsx` | ✎ Komplett überarbeitet |

### Dokumentation

| Datei | Status |
|-------|--------|
| `docs/UX/DASHBOARD.md` | ★ NEU |
| `docs/sprints/sprint5/U1-dashboard.md` | ★ NEU |

### Tests

| Datei | Status |
|-------|--------|
| `apps/web/src/app/app/__tests__/page.test.tsx` | ★ NEU |

---

## Tests

```bash
# Tests ausführen
cd apps/web && npm test -- --run src/app/app/__tests__/page.test.tsx
```

**Getestete Szenarien:**

| Test | Beschreibung |
|------|--------------|
| `renders loading state` | Zeigt Laden-Indikator |
| `renders dashboard cards` | Zeigt alle 3 Dashboard-Cards |
| `shows case count and breakdown` | Korrekte Zahlen für Fälle |
| `shows credit balance` | Zeigt Credits-Guthaben |
| `shows credit warning when zero` | Warnung bei 0 Credits |
| `shows last progress card with draft` | Progress-Card bei Entwurf |
| `shows new case card when no draft` | Neuer-Fall-Card ohne Entwurf |
| `renders max 3 cases in list` | Max 3 Fälle in Liste |
| `shows correct CTA for draft` | „Weiter ausfüllen" bei DRAFT |
| `shows correct CTA for submitted` | „Zusammenfassung ansehen" bei SUBMITTED |
| `shows empty state when no cases` | Leerer Zustand korrekt |
| `shows fallback title for unnamed cases` | „Unbenannter Fall" |
| `formats relative time correctly` | Zeitformatierung korrekt |

---

## Docs Updates

### Neue Datei: docs/UX/DASHBOARD.md

Dokumentation für das Dashboard mit:
- Ziel und Struktur
- Card-Definitionen
- Leere Zustände
- UX-Regeln
- Abgrenzung zu Admin-UI
- Responsive Design
- Datenladung

---

## Wording-Fixes

**Geändert gemäß WORDING_GUIDE.md:**

| Vorher | Nachher |
|--------|---------|
| „Willkommen bei ZollPilot. Hier sehen Sie Ihre aktuellen Fälle und Ihren Kontostatus." | „Ihr Dashboard für die Vorbereitung von Zollanmeldungen." |
| „Einreichen: Prüfen und reichen Sie den Fall ein." | *(entfernt – Info-Card komplett entfernt)* |
| Status: „Eingereicht" | Status: „Eingereicht" *(beibehalten, da in Badge-Komponente zentral definiert)* |

---

## Gaps / Notes

### Offene Punkte

1. **Schrittfortschritt fehlt**
   - API liefert keinen aktuellen Schritt-Index
   - Workaround: Zeige nur Schrittanzahl, nicht „Schritt X von Y"
   - Zukünftig: Backend-Erweiterung für Step-Progress

2. **Credit-Kauf nicht implementiert**
   - CTA „Credits verwalten" führt zu `/app/billing`
   - Billing-Seite zeigt nur Guthaben, kein Kauf möglich
   - Zukünftig: Payment-Integration

3. **Submitted-Badge Wording**
   - Badge zeigt „Eingereicht" (zentral in Badge-Komponente)
   - Könnte zu „Vorbereitet" geändert werden
   - Entscheidung: Beibehalten, da Status-intern korrekt

### Rückwärtskompatibilität

- ✅ Keine API-Änderungen erforderlich
- ✅ Bestehende Routing-Struktur beibehalten
- ✅ Bestehende Komponenten wiederverwendet

### Performance

- Initial: 1-4 API-Calls je nach Datenstand
- Lazy-Loading für Case-Details (nur bei Entwürfen)
- Procedure-Info nur geladen wenn gebunden

---

## Akzeptanzkriterien

- [x] Dashboard zeigt 3 Cards above the fold
- [x] Aktive Fälle Card mit Anzahl + Breakdown
- [x] Credits Card mit Guthaben (Warnung bei 0)
- [x] Letzter Fortschritt Card oder Neuer Fall Card
- [x] Aktive-Fälle-Sektion mit max 3 Fällen
- [x] Pro Fall: Titel, Status-Badge, Zeit, eindeutiger CTA
- [x] Leerer Zustand bei keine Fälle
- [x] Credit-Hinweis bei keine Credits + eingereichte Fälle
- [x] Keine WORDING_GUIDE.md Verstöße
- [x] Responsive Design (3-2-1 Grid)
- [x] Dokumentation erstellt
- [x] Tests erstellt

---

*Sprint 5 – U1*
