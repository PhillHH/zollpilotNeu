# IZA Hero-Flow Analyse & Fix-Vorbereitung

**Datum:** 2026-02-05
**Status:** ✅ Analyse abgeschlossen, Fixes implementiert

> **Hinweis:** Die hier beschriebenen Probleme wurden in `IZA-HERO-FLOW.md` dokumentiert und implementiert.

---

## Analyse-Zusammenfassung

- **Kernfehler in WizardClient.tsx:81**: `isReadonly = caseData?.status !== "DRAFT"` setzt Wizard auf READ-ONLY sobald Verfahren gebunden wird (Status wechselt zu IN_PROCESS)
- Status-Kette: DRAFT → IN_PROCESS → SUBMITTED → ARCHIVED, aber Wizard erlaubt Eingaben nur bei DRAFT
- Badge-Komponente kennt IN_PROCESS nicht → zeigt raw Status-String
- "Bereit" für SUBMITTED ist irreführend – suggeriert "fertig" statt "zur Zollanmeldung vorbereitet"
- 6-7 Klicks vom Dashboard bis zum ersten Eingabefeld
- ProcedureSelector ist unnötige Hürde (90%+ User wollen IZA)
- Wizard-State (`is_completed`) und Case-Status sind entkoppelt und inkonsistent
- Fortschrittsanzeige nur für DRAFT-Cases, nicht für IN_PROCESS
- Kein visueller Unterschied zwischen "gerade erstellt" und "fast fertig"
- Status-Labels inkonsistent: Dashboard zeigt "In Bearbeitung", Badge zeigt nichts

---

## Kritische UX-Probleme

### ❌ BLOCKER: Wizard wird nach Verfahrenswahl unbearbeitbar

**Datei:** `apps/web/src/app/app/cases/[id]/wizard/WizardClient.tsx:81`

```typescript
const isReadonly = caseData?.status !== "DRAFT";
```

**Problem:** Sobald ein Verfahren gebunden wird, wechselt der Status zu `IN_PROCESS`. Die Bedingung `!== "DRAFT"` ist dann true, und der Wizard wird readonly. Der Nutzer kann keine Felder mehr ausfüllen.

**Auswirkung:** Neue IZA-Fälle sind nach dem ersten Schritt (Verfahrensauswahl) komplett unbenutzbar.

---

### ❌ BLOCKER: IN_PROCESS Status fehlt in Badge-Komponente

**Datei:** `apps/web/src/app/design-system/primitives/Badge.tsx`

```typescript
type BadgeStatus = "draft" | "submitted" | "archived";
// IN_PROCESS fehlt!
```

**Problem:** Die Badge-Komponente hat keinen Mapping für `IN_PROCESS`. Das führt dazu, dass der raw String angezeigt wird.

**Auswirkung:** Nutzer sehen "IN_PROCESS" statt "In Bearbeitung" – unprofessionell und verwirrend.

---

### ❌ BLOCKER: Neue Fälle erscheinen "abgeschlossen"

**Ursache:** Kombination aus:
1. Wizard wird nach Verfahrenswahl readonly
2. Kein visueller Fortschrittsunterschied zwischen 0% und 100%
3. Status-Text fehlt oder ist verwirrend

**Auswirkung:** Nutzer denken, ihr Fall ist fertig, obwohl sie noch nichts eingegeben haben.

---

### ⚠️ Reibung: "Bereit" als Label für SUBMITTED

**Datei:** `apps/web/src/app/design-system/primitives/Badge.tsx:48`

```typescript
case "submitted":
  effectiveVariant = "success";
  displayText = "Bereit";
```

**Problem:** "Bereit" suggeriert, dass der Fall abgeschlossen ist. In Wirklichkeit muss der Nutzer noch selbst die Zollanmeldung beim Zoll vornehmen.

**Vorschlag:** Besser: "Vorbereitet" oder "Zur Anmeldung bereit"

---

### ⚠️ Reibung: Klickpfad zu lang

**Aktueller Pfad:**
1. Dashboard öffnen
2. "Fälle" klicken
3. "Neuen Fall erstellen" klicken
4. Case erscheint in Liste
5. "Weiter ausfüllen" klicken
6. Verfahren auswählen (ProcedureSelector)
7. "Verfahren starten" klicken
8. Erstes Eingabefeld erreicht

**Minimum 7 Klicks** bis zum ersten Eingabefeld.

**Vorschlag:** "Neuen IZA-Fall starten" direkt im Dashboard, der Wizard öffnet automatisch.

---

### ⚠️ Reibung: Verfahrensauswahl erzwungen

**Datei:** `apps/web/src/app/app/cases/[id]/wizard/ProcedureSelector.tsx`

**Problem:** Jeder Nutzer muss ein Verfahren auswählen, obwohl IZA der dominante Use-Case ist.

**Vorschlag:** IZA als Default, andere Verfahren nur per Dropdown oder sekundären Link.

---

## Status-/State-Probleme

### Readonly-Check falsch

**Ist:**
```typescript
const isReadonly = caseData?.status !== "DRAFT";
```

**Soll:**
```typescript
const isReadonly = caseData?.status === "SUBMITTED" || caseData?.status === "ARCHIVED";
```

Oder:
```typescript
const isReadonly = ["SUBMITTED", "ARCHIVED"].includes(caseData?.status ?? "");
```

---

### IN_PROCESS fehlt im Badge

**Badge.tsx braucht:**
```typescript
type BadgeStatus = "draft" | "in_process" | "submitted" | "archived";

// Im switch:
case "in_process":
  effectiveVariant = "primary";
  displayText = "In Bearbeitung";
  break;
```

---

### Wizard-/Case-Status entkoppelt

- `WizardState.is_completed` (API)
- `CaseDetail.status` (API)

Zwei separate Wahrheiten, die nicht synchronisiert sind.

**Empfehlung:** Case-Status als Single Source of Truth, Wizard-State nur für UI-Progress.

---

### Fortschrittsberechnung nur bei DRAFT

**Datei:** `apps/web/src/app/app/cases/CasesClient.tsx:167`

```typescript
if (
  c.procedureName === undefined &&
  !c.isLoadingDetails &&
  c.status.toUpperCase() === "DRAFT"  // ← Problem: nur DRAFT
) {
```

**Problem:** Fortschritt wird nur für DRAFT-Cases geladen. IN_PROCESS-Cases zeigen keinen Fortschritt.

---

## Empfohlene Fix-Richtung

### 1. Readonly-Bedingung korrigieren (KRITISCH, SOFORT)

```diff
- const isReadonly = caseData?.status !== "DRAFT";
+ const isReadonly = ["SUBMITTED", "ARCHIVED"].includes(caseData?.status ?? "");
```

---

### 2. IN_PROCESS Status zum Badge hinzufügen

```typescript
// Badge.tsx
type BadgeStatus = "draft" | "in_process" | "submitted" | "archived";

case "in_process":
  effectiveVariant = "primary";
  displayText = "In Bearbeitung";
  break;
```

Dann überall `status="in_process"` verwenden wo aktuell `status.toUpperCase() === "IN_PROCESS"` geprüft wird.

---

### 3. Status-Labels vereinheitlichen

| Status | Aktuell | Empfohlen |
|--------|---------|-----------|
| DRAFT | Entwurf | Entwurf |
| IN_PROCESS | (fehlt) | In Bearbeitung |
| SUBMITTED | Bereit | Vorbereitet |
| ARCHIVED | Archiviert | Archiviert |

---

### 4. Klickpfad optimieren

**Option A (minimal):**
- "Neuen IZA-Fall starten" Button im Dashboard
- Erstellt Case + bindet IZA + öffnet Wizard in einem Schritt

**Option B (optimal):**
- Nach Case-Erstellung automatisch zum Wizard
- IZA als Default-Verfahren
- ProcedureSelector nur bei explizitem Wechselwunsch

---

### 5. Fortschrittsanzeige für alle aktiven Fälle

```diff
- c.status.toUpperCase() === "DRAFT"
+ ["DRAFT", "IN_PROCESS"].includes(c.status.toUpperCase())
```

---

## Offene Fragen / Annahmen

- **Annahme:** 90%+ der Nutzer wollen IZA – falls nicht, ist Procedure-Selector-Vereinfachung weniger kritisch
- **Unklar:** Wird `wizard.complete()` irgendwo aufgerufen vor `cases.submit()`? Wenn ja, wozu zwei separate Endpoints?
- **Unklar:** Warum gibt es `checkWizardAccess`? Wird das vor Wizard-Öffnung geprüft?
- **Offene Frage:** Soll es möglich sein, ein Verfahren zu wechseln nachdem es gebunden wurde (`is_rebind`)?
- **Offene Frage:** Was passiert mit den Feldern wenn ein Case von SUBMITTED zurück zu IN_PROCESS gesetzt wird (falls überhaupt möglich)?
- **Annahme:** Die API-Statusübergänge sind korrekt (DRAFT→IN_PROCESS→SUBMITTED→ARCHIVED), das Problem liegt nur im Frontend

---

## Relevante Dateien

| Datei | Beschreibung |
|-------|--------------|
| `apps/web/src/app/app/cases/[id]/wizard/WizardClient.tsx` | Wizard-Logik, **enthält Kernfehler Zeile 81** |
| `apps/web/src/app/design-system/primitives/Badge.tsx` | Status-Badge, **fehlt IN_PROCESS** |
| `apps/web/src/app/app/cases/CasesClient.tsx` | Cases-Liste, Fortschrittsberechnung |
| `apps/web/src/app/app/cases/[id]/wizard/ProcedureSelector.tsx` | Verfahrensauswahl |
| `apps/web/src/app/lib/api/client.ts` | API-Types, Status-Definitionen |
| `apps/web/src/procedures/IZA/v1/steps.ts` | IZA Wizard-Steps |
| `apps/web/src/app/app/page.tsx` | Dashboard, Status-Badges korrekt |

---

## Nächste Schritte

1. **Fix Readonly-Bedingung** → Wizard wieder benutzbar
2. **Add IN_PROCESS Badge** → konsistente Status-Anzeige
3. **Update SUBMITTED Label** → klarere Kommunikation
4. **Test End-to-End** → vom Dashboard bis zum Submit
5. **Klickpfad-Optimierung** → nach Stabilisierung
