# Fälle – UX Dokumentation

> Dokumentation zur Fallübersicht aus Nutzersicht

## Ziel

Die Fallübersicht ermöglicht Nutzern:

1. **Übersicht** über alle angelegten Fälle
2. **Fortschritt erkennen** auf einen Blick
3. **Nächsten Schritt** sofort identifizieren
4. **Fälle organisieren** durch Benennung und Filterung

## Status vs. Fortschritt

### Unterscheidung

| Aspekt | Status | Fortschritt |
|--------|--------|-------------|
| Bedeutung | Systemzustand des Falls | Bearbeitungsstand im Wizard |
| Werte | DRAFT, SUBMITTED, ARCHIVED | X von Y Schritten |
| Änderung | Durch Systemaktionen | Durch Nutzerinteraktion |
| Darstellung | Badge | Progress-Bar + Text |

### Priorisierung

**Fortschritt ist wichtiger als Status.**

- Bei Entwürfen: Fortschritt prominent anzeigen
- Status nur als sekundäre Information
- CTAs basieren auf Fortschritt, nicht nur Status

## Fallkarten

### Aufbau

```
┌────────────────────────────────────────────────────────┐
│ Titel (editierbar)                    [Status-Badge]   │
│ IZA – Import Zollanmeldung                             │
│ ████░░░░ 2 von 4 Schritten                             │
│ Letzte Änderung: Vor 2 Std.           [Weiter ausfüllen]│
└────────────────────────────────────────────────────────┘
```

### Elemente

1. **Titel**
   - Fallback: „Unbenannter Fall"
   - Editierbar bei Entwürfen (Stift-Icon)
   - Max. 100 Zeichen

2. **Verfahren**
   - Code + Name (z. B. „IZA – Import Zollanmeldung")
   - Nur sichtbar wenn Verfahren gebunden

3. **Fortschritt**
   - Progress-Bar (visuell)
   - Text: „X von Y Schritten"
   - Berechnung: Schritte mit allen Pflichtfeldern ausgefüllt

4. **Status-Badge**
   - Entwurf (grau)
   - Bereit (grün)
   - Archiviert (violett)

5. **Letzte Änderung**
   - Relative Zeit: „Vor X Min.", „Gestern", etc.
   - Absolute Zeit bei > 7 Tagen

6. **Primärer CTA**
   - Genau ein CTA pro Karte
   - Status-abhängig (siehe unten)

### CTAs nach Status

| Status | CTA | Ziel |
|--------|-----|------|
| DRAFT | Weiter ausfüllen | `/app/cases/{id}/wizard` |
| SUBMITTED | Zusammenfassung ansehen | `/app/cases/{id}/summary` |
| ARCHIVED | Fall ansehen | `/app/cases/{id}` |

## Inline-Titel-Bearbeitung

### Interaktion

1. Stift-Icon erscheint bei Hover (nur bei Entwürfen)
2. Klick öffnet Eingabefeld
3. Fokus + Selektion des bestehenden Texts
4. Enter speichert, Escape bricht ab
5. Blur speichert ebenfalls

### Validierung

- Nicht leer (leerer Titel = Fallback bleibt)
- Max. 100 Zeichen
- Sofortige Speicherung via API

### Feedback

- „Speichern..." während API-Call
- Fehler-Alert bei Fehlschlag
- Direkte Aktualisierung bei Erfolg

## Leere Zustände

### Keine Fälle

```
┌─────────────────────────────────────────────┐
│                    📁                        │
│        Keine Fälle gefunden                  │
│                                              │
│   Sie haben noch keine aktiven Fälle.        │
│   Erstellen Sie Ihren ersten Fall, um mit   │
│   der Vorbereitung Ihrer Zollanmeldung      │
│   zu beginnen.                               │
│                                              │
│          [Ersten Fall anlegen]               │
└─────────────────────────────────────────────┘
```

### Nur abgeschlossene Fälle

Info-Banner:
> „Alle Ihre Fälle sind abgeschlossen. Möchten Sie einen neuen Fall starten?"

### Archiviert leer

„Keine archivierten Fälle vorhanden." (ohne CTA)

## Fortschrittsberechnung

### Logik

```
Für jeden Schritt im Verfahren:
  1. Hole alle Pflichtfelder (required = true)
  2. Prüfe ob alle ausgefüllt sind
  3. Wenn ja: Schritt gilt als abgeschlossen

Fortschritt = Abgeschlossene Schritte / Gesamte Schritte
```

### Sonderfälle

- Schritt ohne Pflichtfelder: Gilt als abgeschlossen wenn mindestens ein Feld ausgefüllt
- Kein Verfahren gebunden: Kein Fortschritt angezeigt
- Fehler beim Laden: Fortschritt wird nicht angezeigt

### Performance

- Details werden lazy geladen (nur für sichtbare DRAFT-Fälle)
- Verfahrensdefinitionen werden gecacht
- Keine Verzögerung der initialen Anzeige

## Filter

### Aktive Fälle (Standard)

Zeigt:
- DRAFT
- SUBMITTED

### Archiviert

Zeigt:
- ARCHIVED

## Abgrenzung zu Admin-Views

| Aspekt | Nutzer-View | Admin-View |
|--------|-------------|------------|
| Fälle | Nur eigene | Alle Mandanten |
| Bearbeitung | Titel editieren | Vollzugriff |
| Status ändern | Nein | Ja |
| Tenant-Wechsel | Nein | Ja |
| System-Infos | Nein | Ja (IDs, Timestamps) |

## UX-Regeln

### Sprache

- Keine Behördensprache
- Keine technischen Feldnamen
- Klare, handlungsorientierte CTAs

### Interaktion

- Genau ein primärer CTA pro Karte
- Hover-States für alle interaktiven Elemente
- Fokus-Indikatoren für Keyboard-Navigation

### Feedback

- Loading-States bei API-Calls
- Fehler-Alerts dismissible
- Relative Zeitangaben für Aktualität

## Responsive Design

### Desktop (> 768px)

- Volle Kartendarstellung
- Status + CTA rechts
- Progress-Bar horizontal

### Mobile (≤ 768px)

- Vertikal gestapelt
- Status + CTA in einer Zeile unten
- Volle Breite für Buttons

## Datenfluss

```
1. Initial: initialCases (Server-Side)
   ↓
2. Mount: Refresh via API
   ↓
3. Für jeden DRAFT:
   a. Case-Details laden
   b. Procedure laden (Cache)
   c. Fortschritt berechnen
   ↓
4. State Update → Re-Render
```

## Bekannte Einschränkungen

1. **Fortschritt nur für Entwürfe**
   - Eingereichte Fälle zeigen keinen Fortschritt
   - Optimierung: Weniger API-Calls

2. **Schrittfortschritt approximiert**
   - Basiert auf ausgefüllten Pflichtfeldern
   - Keine Validierungsprüfung

3. **Lazy Loading**
   - Details laden nach Initial-Render
   - Kurzer „Lädt..."-Zustand

---

*Dokumentation erstellt: Sprint 5 – U2*
