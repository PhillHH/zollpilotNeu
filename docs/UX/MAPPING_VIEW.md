# Mapping View – UX Dokumentation

> Dokumentation für die Mapping View („Wo trage ich das beim Zoll ein?")

---

## Ziel

Die Mapping View ist das **zentrale USP-Feature** von ZollPilot. Sie zeigt dem Nutzer:

1. **Welchen Wert** er eingegeben hat
2. **Wo genau** dieser Wert im Zollformular einzutragen ist
3. **Warum** der Zoll diese Information benötigt (optional)

Dies ermöglicht dem Nutzer, seine Zollanmeldung selbstständig und korrekt im offiziellen Zollportal auszufüllen.

---

## Abgrenzung zu PDF

| Aspekt | Mapping View | PDF-Export |
|--------|-------------|------------|
| Format | On-Page, interaktiv | Offline-Dokument |
| Interaktion | Copy-to-Clipboard | Ausdruck/Speichern |
| Aktualisierung | Echtzeit | Snapshot bei Export |
| Kosten | Keine Credits | 1 Credit |
| Zielgruppe | Digitale Selbsteingabe | Dokumentation/Archiv |

Die Mapping View ist die **primäre Methode** für Nutzer, die ihre Daten digital übertragen möchten. Der PDF-Export dient als ergänzende Dokumentation.

---

## Zugang

### Button im Wizard

- **Label**: „Wo trage ich das beim Zoll ein?"
- **Position**: Navigation-Card im Wizard (zwischen „Zurück" und „Weiter/Einreichen")
- **Variant**: Ghost-Button

### Aktivierungsbedingung

Der Button ist **nur aktiv**, wenn:

1. Alle Wizard-Schritte vollständig sind (alle Pflichtfelder ausgefüllt)
2. Der Fall im Status `DRAFT` ist (nicht readonly)

Bei deaktiviertem Button erscheint ein Tooltip:
> „Bitte füllen Sie zuerst alle Pflichtfelder aus"

---

## Layout

### Zwei-Spalten-Design

```
┌─────────────────────────────────────────────────────────────┐
│                 Wo trage ich das beim Zoll ein?              │
│    Diesen Wert kopierst du in das entsprechende Feld im     │
│                      Zollformular.                           │
├─────────────────────────────────────────────────────────────┤
│ Ausgefüllte Felder: 10 von 10                                │
├─────────────────────────────────────────────────────────────┤
│         Deine Angaben          │   Zollformular – Eintrag   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ IZA – Angaben zur Sendung                               │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Inhalt der Sendung         │ IZA – Angaben zur Sendung  │ │
│ │ Electronics - Smartphone   │ Feld „Warenbeschreibung"   │ │
│ │ [Kopieren]                 │ [Warum fragt der Zoll das?]│ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Warenwert (Betrag)         │ IZA – Angaben zur Sendung  │ │
│ │ 150,00                     │ Feld „Warenwert"           │ │
│ │ [Kopieren]                 │ [Warum fragt der Zoll das?]│ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [Zurück zum Formular]              [Verstanden, bereit]     │
├─────────────────────────────────────────────────────────────┤
│ ZollPilot übermittelt keine Daten an Zollbehörden...        │
└─────────────────────────────────────────────────────────────┘
```

### Spalten

| Spalte | Inhalt |
|--------|--------|
| Links | Alltagssprachliche Bezeichnung, eingegebener Wert, Copy-Button |
| Rechts | Zielformular/-seite, Feldnummer/-name, optionale Erklärung |

### Gruppierung

Felder werden nach **Zielformular** gruppiert:
- IZA – Angaben zur Sendung
- IZA – Versender
- IZA – Empfänger
- IZA – Zusätzliche Angaben

---

## Interaktionen

### Copy-to-Clipboard

1. Nutzer klickt auf „Kopieren"
2. Wert wird in die Zwischenablage kopiert
3. Button zeigt kurzzeitig „Kopiert!" (2 Sekunden)
4. Nutzer fügt den Wert im Zollportal ein

### Erklärung anzeigen

1. Nutzer klickt auf „Warum fragt der Zoll das?"
2. Erklärungstext wird eingeblendet
3. Button ändert sich zu „Weniger anzeigen"
4. Erneuter Klick blendet Erklärung wieder aus

### Aktionen

| Button | Funktion |
|--------|----------|
| Zurück zum Formular | Schließt Modal, zurück zum Wizard |
| Verstanden, bereit | Reicht den Fall ein (SUBMITTED), leitet zur Summary weiter |

---

## Wertformatierung

| Feldtyp | Rohwert | Anzeige |
|---------|---------|---------|
| Text | „Electronics" | Electronics |
| Number | 150.00 | 150,00 |
| Boolean | true | Ja |
| Boolean | false | Nein |
| Country | „CN" | China |
| Country | „DE" | Deutschland |
| Leer | null/undefined | Keine Angabe |

---

## Mapping-Konfiguration

### Struktur

Die Mapping-Konfiguration definiert für jedes Feld:

```typescript
type FieldMapping = {
  fieldKey: string;      // Schlüssel im Case (z.B. "content")
  label: string;         // Alltagssprachlich (z.B. "Inhalt der Sendung")
  targetForm: string;    // Zielformular (z.B. "IZA – Angaben zur Sendung")
  targetField: string;   // Feldnummer (z.B. "Feld „Warenbeschreibung"")
  hint?: string;         // Optionale Erklärung
};
```

### Versionierung

- Konfigurationen sind nach Verfahren/Version organisiert
- Schlüssel: `{procedureCode}:{procedureVersion}` (z.B. `IZA:v1`)
- Neue Verfahren werden durch Hinzufügen weiterer Konfigurationen unterstützt

### Erweiterbarkeit

| Verfahren | Status |
|-----------|--------|
| IZA v1 | Implementiert |
| IAA | Geplant |
| IPK | Geplant |

---

## Technische Implementierung

### Dateien

```
apps/web/src/app/app/cases/[id]/wizard/
├── mapping/
│   ├── index.ts              # Exports
│   ├── MappingConfig.ts      # Konfigurationsdatei
│   └── MappingView.tsx       # React-Komponente
└── WizardClient.tsx          # Integration
```

### Komponenten

| Komponente | Funktion |
|------------|----------|
| `MappingView` | Hauptkomponente, Modal-Inhalt |
| `MappingRow` | Einzelne Feld-Zeile |
| `MappingConfig` | Konfigurationsdaten |

### State

- `copiedField`: Aktuell kopiertes Feld (für Feedback)
- `showHint`: Pro Feld, ob Erklärung angezeigt wird
- `showMappingView`: Im WizardClient, Modal-Sichtbarkeit

---

## UX-Regeln

### Sprache

Gemäß [WORDING_GUIDE.md](../WORDING_GUIDE.md):

- **Erlaubt**: „kopieren", „übertragen", „eintragen"
- **Verboten**: „übermitteln", „einreichen", „amtlich"

### Copy-Text

> „Diesen Wert kopierst du in das entsprechende Feld im Zollformular."

### Disclaimer

> „ZollPilot übermittelt keine Daten an Zollbehörden und führt keine Zollanmeldungen durch."

---

## Status-Integration

### Nach Mapping-Bestätigung

Wenn der Nutzer auf „Verstanden, bereit" klickt:

1. Fall wird eingereicht (API: `POST /cases/{id}/submit`)
2. Status ändert sich: `DRAFT` → `SUBMITTED`
3. Weiterleitung zur Summary-Seite
4. Im Dashboard wird der Fall als „Bereit" angezeigt

### Fallback

Wenn der Nutzer nur „Zurück zum Formular" klickt:
- Keine Statusänderung
- Nutzer kann weiter bearbeiten oder später zurückkehren

---

## Barrierefreiheit

- Alle Buttons haben `title`-Attribute
- Fokus-Management beim Modal-Öffnen
- Keyboard-Navigation unterstützt
- Ausreichender Farbkontrast

---

## Responsive Design

### Desktop (≥768px)
- Zwei-Spalten-Layout
- Modal mit max-width 900px

### Mobile (<768px)
- Einspaltiges Layout
- Volle Breite für Buttons
- Scroll bei langen Listen

---

## Rechtlicher Hinweis

Die Mapping View ist ein **Vorbereitungstool**:

- Keine Datenübermittlung an Zollbehörden
- Keine amtliche Funktion
- Der Nutzer ist für die korrekte Eingabe verantwortlich
- Die eigentliche Zollanmeldung erfolgt im offiziellen Zollportal

---

*Dokumentation erstellt: Sprint UX-U3*
