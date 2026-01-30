# Sprint 5 – U3 Mapping View

> „Wo trage ich das beim Zoll ein?"

---

## Prompt

Implementierung der Mapping-/Prüfansicht im Wizard, die dem Nutzer zeigt:
- Welchen Wert er eingegeben hat
- Wo genau dieser Wert im Zollsystem einzutragen ist
- Mit Copy-Paste-Unterstützung

Dies ist das zentrale USP-Feature von ZollPilot.

---

## Ergebnis

### Implementiert

1. **Mapping-Konfiguration (IZA v1)**
   - 10 Felder mit alltagssprachlichen Labels
   - Zielformular und Feldnummer definiert
   - Optionale Erklärungen („Warum fragt der Zoll das?")

2. **Mapping View Komponente**
   - Zwei-Spalten-Layout (Eingabe ↔ Zielfeld)
   - Gruppierung nach Zielformular
   - Copy-to-Clipboard mit Feedback

3. **Wizard-Integration**
   - Button umbenannt: „Prüfen" → „Wo trage ich das beim Zoll ein?"
   - Button nur aktiv wenn alle Pflichtfelder ausgefüllt
   - Modal-Overlay im Wizard

4. **Status-Integration**
   - „Verstanden, bereit" → Fall einreichen (SUBMITTED)
   - Weiterleitung zur Summary-Seite

---

## Dateien

### Erstellt

| Datei | Beschreibung |
|-------|--------------|
| `apps/web/src/app/app/cases/[id]/wizard/mapping/MappingConfig.ts` | Mapping-Konfiguration für IZA v1 |
| `apps/web/src/app/app/cases/[id]/wizard/mapping/MappingView.tsx` | React-Komponente für Mapping-Ansicht |
| `apps/web/src/app/app/cases/[id]/wizard/mapping/index.ts` | Export-Datei |
| `apps/web/tests/mapping-view.test.tsx` | Unit-Tests für Mapping View |
| `docs/UX/MAPPING_VIEW.md` | UX-Dokumentation |

### Geändert

| Datei | Änderung |
|-------|----------|
| `apps/web/src/app/app/cases/[id]/wizard/WizardClient.tsx` | Button umbenannt, MappingView integriert, allStepsComplete-Logik |
| `apps/web/tests/wizard.test.tsx` | Tests für neuen Button-Text angepasst |

---

## Tests

### Neue Tests (`mapping-view.test.tsx`)

- `getMappingConfig` returns IZA v1 config
- `getMappingConfig` returns null for unknown procedure
- `getFieldMapping` returns correct mapping for content field
- IZA v1 config has all expected fields
- All mappings have required properties
- MappingView renders with correct title
- MappingView renders all field values
- MappingView renders target form information
- Copy button copies value to clipboard
- Copy button shows „Kopiert!" after clicking
- Shows hint when toggle is clicked
- Calls onClose when back button is clicked
- Calls onConfirm when confirm button is clicked
- Shows warning for unknown procedure
- Shows „Keine Angabe" for empty values
- Displays country names instead of codes
- Displays formatted amount
- Displays boolean as Ja/Nein
- Shows filled field count
- Shows disclaimer about ZollPilot

### Angepasste Tests (`wizard.test.tsx`)

- Tests für „Prüfen"-Button auf neuen Button-Text aktualisiert
- Validierung wird jetzt über „Weiter" und „Einreichen" getriggert

---

## Docs Updates

| Dokument | Änderung |
|----------|----------|
| `docs/UX/MAPPING_VIEW.md` | Neu erstellt: Vollständige UX-Dokumentation |

---

## Gaps / Notes

### Bekannte Einschränkungen

1. **Nur IZA v1 konfiguriert**
   - IAA und IPK müssen in zukünftigen Sprints hinzugefügt werden
   - Konfiguration ist vorbereitet für Erweiterung

2. **Keine Backend-Änderungen**
   - Status „Bereit" ist Frontend-Label für SUBMITTED
   - Kein neuer Backend-Status erforderlich

3. **Kein Offline-Support**
   - Clipboard-API benötigt HTTPS in Production
   - Fallback für ältere Browser nicht implementiert

### Architektur-Entscheidungen

- **Modal statt separate Route**: MappingView als Overlay im Wizard, nicht als eigene Route
- **Konfiguration statt Datenbank**: Mapping-Definitionen in TypeScript, nicht in DB
- **Client-seitig**: Keine Server-Komponente für Clipboard-Zugriff

### Wording-Konformität

Alle Texte entsprechen dem WORDING_GUIDE:
- Keine Verwendung von „übermitteln", „einreichen", „amtlich"
- Klarer Disclaimer über Produktgrenzen

---

## Summary

Das zentrale USP-Feature „Mapping View" wurde implementiert. Nutzer können nun nach vollständiger Eingabe aller Pflichtfelder eine Übersicht öffnen, die zeigt, wo sie ihre Angaben im Zollformular eintragen müssen. Die Copy-to-Clipboard-Funktion ermöglicht effizientes Übertragen der Werte. Nach Bestätigung wird der Fall automatisch eingereicht.

---

## Changed/Created Files

```
apps/web/src/app/app/cases/[id]/wizard/
├── mapping/
│   ├── index.ts              [NEW]
│   ├── MappingConfig.ts      [NEW]
│   └── MappingView.tsx       [NEW]
└── WizardClient.tsx          [MODIFIED]

apps/web/tests/
├── mapping-view.test.tsx     [NEW]
└── wizard.test.tsx           [MODIFIED]

docs/
├── UX/MAPPING_VIEW.md        [NEW]
└── sprints/sprint5/U3-mapping-view.md [NEW]
```

---

*Sprint Log erstellt: Sprint 5 – UX-U3*
