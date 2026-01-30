# Dashboard UX

> Dokumentation für das Kunden-Dashboard (`/app`)

---

## Ziel

Das Dashboard soll Nutzern innerhalb von 5 Sekunden vermitteln:

1. **Wo sie stehen** – Aktueller Status (Fälle, Credits)
2. **Was offen ist** – Offene Entwürfe, fehlende Aktionen
3. **Was der nächste sinnvolle Schritt ist** – Klare, eindeutige CTAs

---

## Struktur

### Above the Fold: Dashboard-Cards

Drei Karten zeigen die wichtigsten Informationen auf einen Blick:

```
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ 📋 AKTIVE FÄLLE│ │ 💳 CREDITS     │ │ ✏️ LETZTER     │
│                │ │                │ │   FORTSCHRITT  │
│ 5 Fälle        │ │ 12             │ │ "Mein Fall"    │
│ 3 Entwürfe     │ │ verfügbar      │ │ IZA · 4 Steps  │
│ 2 Abgeschlossen│ │                │ │ Vor 2 Std.     │
│                │ │                │ │                │
│ [Fälle zeigen] │ │ [Verwalten]    │ │ [Fortsetzen]   │
└────────────────┘ └────────────────┘ └────────────────┘
```

#### 1. Aktive Fälle

| Element | Beschreibung |
|---------|--------------|
| Anzahl | Gesamtzahl aktiver Fälle (DRAFT + SUBMITTED) |
| Breakdown | Anzahl Entwürfe / Abgeschlossene |
| CTA | „Fälle anzeigen" → `/app/cases` |

#### 2. Credits

| Element | Beschreibung |
|---------|--------------|
| Guthaben | Aktueller Credit-Stand (visuell hervorgehoben) |
| Warnung | Bei 0 Credits: Hinweistext + Warnung-Farbe |
| CTA | „Credits verwalten" → `/app/billing` |

#### 3. Letzter Fortschritt / Neuer Fall

**Mit offenem Entwurf:**

| Element | Beschreibung |
|---------|--------------|
| Titel | Fallname (Fallback: „Unbenannter Fall") |
| Verfahren | Prozedurname + Schrittanzahl |
| Zeitstempel | „Zuletzt bearbeitet: Vor X Min." |
| CTA | „Fall fortsetzen" → `/app/cases/{id}/wizard` |

**Ohne Entwurf:**

| Element | Beschreibung |
|---------|--------------|
| Titel | „Neuer Fall" |
| Text | „Starten Sie mit der Vorbereitung..." |
| CTA | „Neuen Fall erstellen" → `/app/cases` |

---

### Aktive-Fälle-Sektion

Unterhalb der Cards werden die letzten 3 Fälle angezeigt:

```
┌─────────────────────────────────────────────────────────┐
│ Ihre Fälle                          [Alle anzeigen (5)] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Mein erster Import  [Entwurf]    [Weiter ausfüllen] │ │
│ │ Letzte Änderung: Vor 2 Std.                         │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ China Import Q4     [Eingereicht] [Zusammenfassung] │ │
│ │ Letzte Änderung: Gestern                            │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Testfall            [Entwurf]    [Weiter ausfüllen] │ │
│ │ Letzte Änderung: Vor 3 Tagen                        │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Pro Fall:**

| Element | Beschreibung |
|---------|--------------|
| Titel | Fallname (Fallback: „Unbenannter Fall") |
| Status | Badge: Entwurf / Eingereicht / Archiviert |
| Zeitstempel | „Letzte Änderung: [relative Zeit]" |
| CTA | Entwurf → „Weiter ausfüllen", Eingereicht → „Zusammenfassung ansehen" |

---

## Leere Zustände

### Keine Fälle vorhanden

```
┌─────────────────────────────────────────────────────────┐
│                         📭                               │
│                                                         │
│          Noch keine Fälle vorhanden                     │
│                                                         │
│   Erstellen Sie Ihren ersten Fall, um mit der          │
│   Vorbereitung Ihrer Zollanmeldung zu beginnen.        │
│                                                         │
│              [Neuen Fall erstellen]                     │
└─────────────────────────────────────────────────────────┘
```

### Keine Credits vorhanden

Bei eingereichten Fällen wird ein Info-Alert angezeigt:

```
ℹ️ Keine Credits vorhanden. Um PDFs zu exportieren,
   benötigen Sie Credits. [Zur Abrechnung]
```

---

## UX-Regeln

### Fortschritt > Status

Der Fokus liegt auf dem **Fortschritt**, nicht auf technischen Status-Codes:

| Statt | Lieber |
|-------|--------|
| Status: DRAFT | 3 Entwürfe |
| Status: SUBMITTED | 2 Abgeschlossen |
| updated_at: 2024-01-15 | Vor 2 Tagen |

### Keine Behördensprache

Siehe [WORDING_GUIDE.md](../WORDING_GUIDE.md):

| Verboten | Erlaubt |
|----------|---------|
| „Einreichen" | „Vorbereiten", „Exportieren" |
| „Zollanmeldung durchführen" | „Zollanmeldung vorbereiten" |
| „Amtliches Dokument" | „Ausfüllhilfe", „Übersicht" |

### Keine doppelten CTAs

Jede Karte und jeder Listeneintrag hat **genau einen** primären CTA.

### Keine Admin-/Systemdaten

Das Dashboard zeigt **ausschließlich** nutzerbezogene Daten:

- ✅ Eigene Fälle
- ✅ Eigenes Credit-Guthaben
- ❌ Tenant-ID
- ❌ Technische IDs
- ❌ Admin-Statistiken

---

## Abgrenzung zu Admin-UI

| User-Dashboard (`/app`) | Admin-Dashboard (`/admin`) |
|------------------------|---------------------------|
| Zeigt eigene Fälle | Zeigt alle Mandanten |
| Credits des Nutzers | Guthaben aller Mandanten |
| Fortsetzen-Aktion | Verwalten-Aktionen |
| Kein Mandantenüberblick | Vollständiger Systemüberblick |

---

## Responsive Design

### Desktop (≥1024px)

- 3-Spalten-Grid für Dashboard-Cards
- Fälle als horizontale Karten

### Tablet (768px–1023px)

- 2-Spalten-Grid für Dashboard-Cards
- Dritte Karte spannt volle Breite

### Mobile (<768px)

- 1-Spalte für alle Elemente
- CTAs in Karten nutzen volle Breite
- Fälle stacken vertikal

---

## Datenladung

### Initiale Ladung

1. `GET /cases?status=active` – Alle aktiven Fälle
2. `GET /billing/me` – Credit-Stand
3. Bei Entwürfen: `GET /cases/{id}` – Details des letzten Entwurfs
4. Bei gebundener Prozedur: `GET /procedures/{code}` – Schrittanzahl

### Fehlerbehandlung

- Billing-Fehler: Karte zeigt „Credits konnten nicht geladen werden"
- Case-Fehler: Alert-Banner mit Retry-Option

---

## Metriken (zukünftig)

Mögliche UX-Metriken zur Erfolgsmessung:

- **Time to first action**: Zeit bis zum ersten Klick
- **CTA-Klickrate**: Welche Cards werden am meisten genutzt
- **Empty-State-Conversions**: Wie viele erstellen nach Leerstand einen Fall

---

*Dokumentation Stand: Sprint 5*
