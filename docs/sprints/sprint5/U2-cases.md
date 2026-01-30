# U2 – Fälle & Progress UX

> **Sprint 5** – Fallübersicht aus Nutzersicht verbessern

## Prompt (Zusammenfassung)

```
GOAL
Die Fallübersicht so verbessern, dass:
- Fälle sofort verständlich sind
- Fortschritt visuell erkennbar ist
- „Untitled"-Fälle vermieden werden
- der Nutzer immer weiß, was als Nächstes zu tun ist

SCOPE
A) Fallkarten mit Titel, Verfahren, Fortschritt, Status, CTA
B) Fortschrittslogik basierend auf Wizard-Schritten
C) Inline-Titel-Bearbeitung
D) Leere & Randzustände
E) UX-Regeln (keine Behördensprache)
F) Tests
G) Dokumentation
```

---

## Summary

### Implementierte Features

**Fallkarten (erweitert):**

| Element | Neu | Beschreibung |
|---------|-----|--------------|
| Titel | ✓ | Editierbar mit Fallback „Unbenannter Fall" |
| Verfahren | ★ | Code + Name (z. B. „IZA – Import Zollanmeldung") |
| Fortschritt | ★ | Progress-Bar + „X von Y Schritten" |
| Status-Badge | ✓ | Entwurf / Bereit / Archiviert |
| Relative Zeit | ★ | „Vor 2 Std.", „Gestern", etc. |
| Primärer CTA | ✓ | Status-spezifisch (Weiter ausfüllen / Zusammenfassung / Ansehen) |

**Fortschrittslogik:**

```
Für jeden Schritt:
  Pflichtfelder prüfen → Wenn alle ausgefüllt → Schritt abgeschlossen

Fortschritt = Abgeschlossene / Gesamt
```

- Lazy Loading für Case-Details
- Procedure-Cache für Performance
- Nur für DRAFT-Fälle berechnet

**Inline-Titel-Bearbeitung:**

- Stift-Icon bei Hover (nur DRAFT)
- Eingabefeld mit Fokus + Selektion
- Validierung: max. 100 Zeichen
- Speicherung: Enter, Blur
- Abbruch: Escape

**Leere Zustände:**

- Keine Fälle: Copy + CTA „Ersten Fall anlegen"
- Nur abgeschlossene: Info-Banner
- Archiviert leer: Einfache Meldung

**Status-Wording:**

| API-Status | Anzeige |
|------------|---------|
| DRAFT | Entwurf |
| SUBMITTED | Bereit |
| ARCHIVED | Archiviert |

---

## Changed/Created Files

### Frontend

| Datei | Status |
|-------|--------|
| `apps/web/src/app/app/cases/CasesClient.tsx` | ✎ Komplett überarbeitet |

### Tests

| Datei | Status |
|-------|--------|
| `apps/web/tests/cases-client.test.tsx` | ★ NEU |

### Dokumentation

| Datei | Status |
|-------|--------|
| `docs/UX/CASES.md` | ★ NEU |
| `docs/sprints/sprint5/U2-cases.md` | ★ NEU |

---

## Tests

```bash
# Tests ausführen
cd apps/web && npx vitest --run tests/cases-client.test.tsx
```

**Getestete Szenarien:**

| Test | Beschreibung |
|------|--------------|
| `rendert mehrere Fälle` | Liste mit mehreren Fällen |
| `zeigt Fallback-Titel` | "Unbenannter Fall" bei leerem Titel |
| `zeigt Status-Badges` | Entwurf, Bereit, Archiviert |
| `zeigt relative Zeitangabe` | Vor X Std., Gestern |
| `zeigt korrekten CTA` | Weiter ausfüllen / Zusammenfassung / Ansehen |
| `lädt Falldetails für Entwürfe` | Lazy Loading |
| `zeigt Verfahrensname` | IZA – Import Zollanmeldung |
| `zeigt Schrittfortschritt` | X von Y Schritten |
| `öffnet Eingabefeld bei Klick` | Inline-Edit |
| `speichert neuen Titel bei Enter` | API-Call |
| `zeigt keinen Edit für eingereicht` | Readonly |
| `ruft API ohne tenant_id` | Mandanten-Isolation |
| `verwendet keine verbotenen Begriffe` | WORDING_GUIDE |
| `zeigt leeren Zustand` | Keine Fälle |
| `zeigt Hinweis nur abgeschlossene` | Info-Banner |

---

## Docs Updates

### Neue Datei: docs/UX/CASES.md

Dokumentation für die Fallübersicht mit:
- Ziel und Struktur
- Status vs. Fortschritt
- Fallkarten-Aufbau
- CTAs nach Status
- Inline-Bearbeitung
- Leere Zustände
- Fortschrittsberechnung
- Abgrenzung zu Admin-Views
- UX-Regeln
- Responsive Design

---

## Architektur-Entscheidungen

### Fortschritt: Client-Side Berechnung

**Entscheidung:** Fortschritt wird im Client aus Case-Details + Procedure berechnet.

**Alternativen:**
1. Backend-API erweitern (progress-Feld)
2. SSR mit Server-Side Berechnung

**Begründung:**
- Keine Backend-Änderungen nötig
- Lazy Loading reduziert Initial-Load
- Procedure-Cache minimiert API-Calls

### Status-Wording: "Bereit" statt "Eingereicht"

**Entscheidung:** SUBMITTED wird als „Bereit" angezeigt.

**Begründung:**
- „Eingereicht" suggeriert Einreichung beim Zoll
- „Bereit" ist neutral und korrekt
- WORDING_GUIDE.md Compliance

---

## Gaps / Notes

### Offene Punkte

1. **API-Erweiterung für Progress**
   - Fortschritt könnte serverseitig berechnet werden
   - Würde Client-Logik vereinfachen
   - Niedrige Priorität (aktuelle Lösung funktioniert)

2. **Validierungsstatus im Fortschritt**
   - Aktuell: Nur Pflichtfelder-Check
   - Möglich: Auch Validierungsfehler berücksichtigen
   - Würde zusätzliche API-Calls erfordern

3. **Bulk-Operationen**
   - Mehrere Fälle auswählen
   - Bulk-Archivieren
   - Nicht im Scope

### Rückwärtskompatibilität

- ✅ Keine API-Änderungen erforderlich
- ✅ Bestehende Case-Struktur beibehalten
- ✅ Fallback für fehlende Procedure-Daten

### Performance

- Lazy Loading für Details (nur DRAFT)
- Procedure-Cache (in-memory)
- Keine Verzögerung der initialen Liste

---

## Akzeptanzkriterien

- [x] Fallkarten zeigen Titel, Verfahren, Fortschritt, Status
- [x] Fortschritt basiert auf abgeschlossenen Wizard-Schritten
- [x] Fortschritt visuell als Progress-Bar dargestellt
- [x] Titel inline editierbar (nur DRAFT)
- [x] Validierung: max. 100 Zeichen
- [x] Fallback „Unbenannter Fall" bei leerem Titel
- [x] Status-spezifische CTAs
- [x] Leerer Zustand mit CTA
- [x] Hinweis bei nur abgeschlossenen Fällen
- [x] Keine WORDING_GUIDE.md Verstöße
- [x] Mandanten-Isolation (keine tenant_id in API)
- [x] Tests erstellt
- [x] Dokumentation erstellt

---

*Sprint 5 – U2*
