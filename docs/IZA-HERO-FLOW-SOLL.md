# IZA Hero-Flow – SOLL-Zielbild & Statusmodell

**Datum:** 2026-02-05
**Status:** Verbindliche Spezifikation
**Basis:** IZA-HERO-FLOW-ANALYSE.md

---

## Ziel-Hero-Flow (Kurzfassung)

1. **Dashboard**: Prominenter CTA "Neue Zollanmeldung vorbereiten"
2. **Case wird erstellt** mit Status `DRAFT`, IZA automatisch gebunden → Status wechselt zu `IN_PROCESS`
3. **Wizard öffnet direkt** auf Schritt 1 (Paket) – kein Procedure-Selector
4. **Nutzer füllt 4 Schritte aus** – Autosave, jederzeit unterbrechbar
5. **Abschluss**: Nutzer klickt "Vorbereitung abschließen" → Status wechselt zu `PREPARED`
6. **Summary-Seite**: Nutzer sieht Zusammenfassung, kann PDF exportieren, startet Ausfüllhilfe
7. **Nach Zollanmeldung**: Nutzer markiert Fall als erledigt → Status wechselt zu `COMPLETED`

**Kernprinzip:** Der Nutzer versteht zu jedem Zeitpunkt, wo er steht und was als Nächstes kommt.

---

## Verbindliches Statusmodell

### Case-Status (Single Source of Truth)

| Status | Label (DE) | Bedeutung | Wizard | Aktionen |
|--------|-----------|-----------|--------|----------|
| `DRAFT` | — | Interner Zwischenzustand bei Erstellung | — | Wird sofort zu IN_PROCESS |
| `IN_PROCESS` | **In Bearbeitung** | Nutzer füllt Wizard aus | ✅ Editierbar | Felder bearbeiten, speichern, unterbrechen |
| `PREPARED` | **Vorbereitet** | Wizard abgeschlossen, bereit für Zollanmeldung | 🔒 Read-only | PDF exportieren, Ausfüllhilfe nutzen, als erledigt markieren |
| `COMPLETED` | **Erledigt** | Zollanmeldung wurde beim Zoll eingereicht | 🔒 Read-only | Ansehen, archivieren |
| `ARCHIVED` | **Archiviert** | Fall abgelegt | 🔒 Read-only | Nur ansehen |

### Status-Übergänge

```
DRAFT ──(IZA binden)──▶ IN_PROCESS ──(Submit)──▶ PREPARED ──(Erledigt markieren)──▶ COMPLETED ──(Archivieren)──▶ ARCHIVED
                              │                       │
                              │                       ▼
                              │               (Zurück zu IN_PROCESS möglich)
                              │                       │
                              └───────────────────────┘
```

### Hinweis zu SUBMITTED

Der aktuelle Status `SUBMITTED` wird umbenannt zu `PREPARED`, weil:
- "Submitted" suggeriert, dass etwas eingereicht wurde (beim Zoll)
- ZollPilot reicht NICHT beim Zoll ein – der Nutzer tut das selbst
- "Vorbereitet" ist semantisch korrekt: Die Vorbereitung ist abgeschlossen

---

## Wizard-Regeln pro Status

### IN_PROCESS (In Bearbeitung)

| Aspekt | Verhalten |
|--------|-----------|
| Wizard-Zugang | ✅ Vollständig zugänglich |
| Felder editierbar | ✅ Ja, alle Felder |
| Autosave | ✅ Aktiv (500ms Debounce) |
| Navigation | ✅ Vor/Zurück zwischen Schritten |
| Fortschrittsanzeige | ✅ Sichtbar (X von Y Schritten) |
| Submit-Button | ✅ Sichtbar auf letztem Schritt |
| Submit-Bedingung | Alle Pflichtfelder ausgefüllt |

### PREPARED (Vorbereitet)

| Aspekt | Verhalten |
|--------|-----------|
| Wizard-Zugang | ⚠️ Nur Lesen (View-Mode) |
| Felder editierbar | ❌ Nein |
| Autosave | ❌ Deaktiviert |
| Navigation | ✅ Ansicht aller Schritte |
| Fortschrittsanzeige | ✅ "Abgeschlossen" |
| Zurück-zu-Bearbeitung | ✅ Button "Daten korrigieren" → zurück zu IN_PROCESS |

### COMPLETED / ARCHIVED

| Aspekt | Verhalten |
|--------|-----------|
| Wizard-Zugang | 🔒 Nur Lesen |
| Felder editierbar | ❌ Nein |
| Zurück möglich | ❌ Nein |

### Wizard-Completion (UI-Logik)

Der Wizard gilt als "abgeschlossen" wenn:
- Alle Pflichtfelder aller Schritte ausgefüllt sind
- UND der Case-Status `PREPARED` oder höher ist

**Wichtig:** `wizard.is_completed` ist ein berechneter Wert, kein gespeicherter Status.

---

## UX-Texte (final)

### Status-Badges

| Status | Badge-Text | Farbe | Icon |
|--------|-----------|-------|------|
| `IN_PROCESS` | In Bearbeitung | Blau (Primary) | ✏️ |
| `PREPARED` | Vorbereitet | Grün (Success) | ✓ |
| `COMPLETED` | Erledigt | Grau (Neutral) | ✓✓ |
| `ARCHIVED` | Archiviert | Grau (Muted) | 📁 |

### Dashboard

| Element | Text |
|---------|------|
| Haupt-CTA | "Neue Zollanmeldung vorbereiten" |
| Metrikkarte 1 | "In Bearbeitung" (Anzahl IN_PROCESS) |
| Metrikkarte 2 | "Vorbereitet" (Anzahl PREPARED) |
| Metrikkarte 3 | "Fälle gesamt" |

### Case-Liste

| Status | CTA-Button |
|--------|-----------|
| `IN_PROCESS` | "Weiter ausfüllen" |
| `PREPARED` | "Zusammenfassung ansehen" |
| `COMPLETED` | "Details ansehen" |
| `ARCHIVED` | "Ansehen" |

### Wizard

| Element | Text |
|---------|------|
| Header | "Internetbestellung – Import Zollanmeldung" |
| Fortschritt | "Schritt X von 4" |
| Submit-Button | "Vorbereitung abschließen" |
| Nach Submit | "Ihre Daten sind bereit für die Zollanmeldung" |

### Summary-Seite

| Element | Text |
|---------|------|
| Titel | "[Fallname] – Zusammenfassung" |
| Status-Hinweis (PREPARED) | "Ihre Zollanmeldung ist vorbereitet. Nutzen Sie die Ausfüllhilfe, um die Daten beim Zoll einzutragen." |
| Haupt-CTA | "Ausfüllhilfe starten" |
| Sekundär-CTA | "PDF herunterladen" |
| Erledigt-Button | "Als erledigt markieren" |

### Readonly-Banner (im Wizard bei PREPARED)

```
ℹ️ Nur Ansicht
Diese Vorbereitung ist abgeschlossen. Sie können die Daten ansehen, aber nicht mehr ändern.
[Daten korrigieren] ← Button, um zurück zu IN_PROCESS zu wechseln
```

---

## Implementierungs-Implikationen (ohne Code)

### 1. Status-Umbenennung

- `SUBMITTED` → `PREPARED` (semantisch korrekter)
- Neuer Status `COMPLETED` zwischen PREPARED und ARCHIVED
- DRAFT bleibt, aber ist nur transienter Initialzustand

### 2. Readonly-Bedingung ändern

**Aktuell (falsch):**
```
readonly = status !== "DRAFT"
```

**SOLL:**
```
readonly = status in ["PREPARED", "COMPLETED", "ARCHIVED"]
```

### 3. Badge-Komponente erweitern

Neue Status-Mappings:
- `in_process` → "In Bearbeitung" (Blau)
- `prepared` → "Vorbereitet" (Grün)
- `completed` → "Erledigt" (Grau)
- `archived` → "Archiviert" (Grau/Muted)

### 4. Procedure-Selector entfernen

- IZA ist Default und wird automatisch gebunden
- Case-Erstellung + IZA-Binding in einem API-Call
- Wizard öffnet direkt nach Erstellung
- Für andere Verfahren (IPK, IAA): Separater Einstieg oder Dropdown im Dashboard

### 5. Klickpfad-Reduktion

**Aktuell:** Dashboard → Cases → Create → List → Case → Wizard → Procedure → Eingabe (7 Klicks)

**SOLL:** Dashboard → CTA "Neue Zollanmeldung" → Wizard Schritt 1 (2 Klicks)

### 6. Neue Transition: PREPARED → IN_PROCESS

- "Daten korrigieren" Button auf Summary-Seite
- Setzt Status zurück auf IN_PROCESS
- Wizard wird wieder editierbar
- Wichtig: Nur vor COMPLETED möglich

### 7. Neue Transition: PREPARED → COMPLETED

- "Als erledigt markieren" Button auf Summary-Seite
- Nutzer bestätigt, dass Zollanmeldung beim Zoll eingereicht wurde
- Optional: Datum der Einreichung erfassen

### 8. API-Anpassungen

| Endpoint | Änderung |
|----------|----------|
| `POST /cases` | Optional: `procedure_code` Parameter für Auto-Binding |
| `POST /cases/:id/reopen` | Neu: PREPARED → IN_PROCESS |
| `POST /cases/:id/complete` | Neu: PREPARED → COMPLETED |
| Status-Enum | SUBMITTED → PREPARED, + COMPLETED |

### 9. Fortschrittsanzeige erweitern

- Progress für IN_PROCESS und PREPARED anzeigen
- Bei PREPARED: "4 von 4 Schritten – Abgeschlossen"
- Visuelle Unterscheidung: IN_PROCESS = Fortschrittsbalken, PREPARED = Häkchen

---

## Entscheidung: Procedure-Selector

**Entscheidung:** Procedure-Selector wird für IZA übersprungen.

**Begründung:**
1. IZA ist der primäre Use-Case (>90% der Nutzer)
2. Jeder zusätzliche Klick erhöht Abbruchrate
3. Private Nutzer brauchen keine Auswahl – sie importieren Pakete
4. Andere Verfahren (IPK, IAA) können über separaten Einstieg erreicht werden

**Umsetzung:**
- Dashboard-CTA erstellt Case mit `procedure_code: "IZA"`
- Wizard öffnet direkt
- Für andere Verfahren: Link "Anderes Verfahren wählen" in Footer oder Settings

---

## Zusammenfassung der Änderungen

| Bereich | IST | SOLL |
|---------|-----|------|
| Status nach Verfahren-Binding | IN_PROCESS (readonly!) | IN_PROCESS (editierbar) |
| Status-Label "SUBMITTED" | "Bereit" | "Vorbereitet" |
| Neuer Status | — | COMPLETED |
| Klicks bis Wizard | 7 | 2 |
| Procedure-Selector | Pflicht | Übersprungen (IZA Default) |
| Readonly-Bedingung | `!== DRAFT` | `in [PREPARED, COMPLETED, ARCHIVED]` |
| Zurück zu Bearbeitung | Nicht möglich | "Daten korrigieren" Button |

---

## Validierung des Zielbilds

**Nutzer-Szenario (Happy Path):**

1. Maria öffnet ZollPilot Dashboard
2. Sie klickt "Neue Zollanmeldung vorbereiten"
3. Wizard öffnet auf Schritt 1 (Paket)
4. Sie trägt Inhalt, Wert, Währung, Herkunftsland ein
5. Klickt "Weiter", füllt Absender aus
6. Klickt "Weiter", füllt Empfänger aus
7. Klickt "Weiter", bestätigt "Keine gewerbliche Einfuhr"
8. Klickt "Vorbereitung abschließen"
9. Summary-Seite zeigt ihre Daten
10. Sie klickt "Ausfüllhilfe starten"
11. Nach Zollanmeldung: Klickt "Als erledigt markieren"
12. Fall ist abgeschlossen

**Mentales Modell:**
- "In Bearbeitung" = Ich fülle noch aus
- "Vorbereitet" = Ich muss jetzt zum Zoll
- "Erledigt" = Fertig, Paket kommt

Dieses Modell ist intuitiv und erfordert keine Erklärung.
