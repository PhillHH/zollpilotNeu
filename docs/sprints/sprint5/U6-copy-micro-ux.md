# Sprint UX-U6: Copy & Micro-UX Hardening

## Ziel
Sprachliche und UX-Konsistenz herstellen. Keine neuen Features, nur Qualitat und Klarheit.

## Abgeschlossene Arbeiten

### 1. Copy-Audit durchgefuhrt

#### Status-Labels (Badge.tsx)
- "Eingereicht" -> "Bereit" (fur SUBMITTED Status)

#### Navigation (AppShell.tsx)
- "Abrechnung" -> "Kosten & Credits"

#### Dashboard (page.tsx)
- "Credits verwalten" -> "Kosten anzeigen"
- "Zur Abrechnung" -> "Zu Kosten & Credits"
- "PDFs zu exportieren" -> "Ausfullhilfen zu exportieren"

#### Wizard (WizardClient.tsx)
- "Zuruck" -> "Schritt zuruck"
- "Einreichen" -> "Vorbereitung abschliessen"
- "Fehler beim Einreichen" -> "Fehler beim Abschliessen der Vorbereitung"
- "Dieser Fall wurde bereits eingereicht..." -> "Dieser Fall ist abgeschlossen..."

#### Profil (ProfileClient.tsx)
- "Profil speichern" -> "Anderungen sichern"

#### Abrechnung (BillingClient.tsx)
- "Abrechnung" -> "Kosten & Credits"
- "Lade Abrechnungsdaten..." -> "Lade Kosten und Credits..."

#### Zusammenfassung (SummaryClient.tsx)
- "Noch nicht eingereicht" -> "Noch nicht abgeschlossen"
- "Der Fall wurde noch nicht eingereicht..." -> "Der Case wurde noch nicht abgeschlossen..."
- "Eingereicht am" -> "Bereit seit"

#### Landing Page (page.tsx)
- "Selbst einreichen" -> "Selbst abgeben"

### 2. Test-Anpassungen

Alle Tests aktualisiert fur neue Texte:
- `dashboard.test.tsx`: CTA-Texte
- `design-system.test.tsx`: Badge-Status
- `billing.test.tsx`: Seitentitel und Ladezustande
- `app-ui.test.tsx`: Navigation
- `summary.test.tsx`: Status und Empty-States
- `cases-client.test.tsx`: Status-Anzeige
- `wizard.test.tsx`: Readonly-Banner

### 3. Dokumentation

- `docs/UX/WORDING.md` erstellt: Zentrale Wording-Referenz

### 4. Test-Setup verbessert

- `tests/setup.ts`: React global verfugbar gemacht fur JSX

## Einhaltung WORDING_GUIDE.md

Alle verbotenen Begriffe entfernt:
- "einreichen" -> "abschliessen", "vorbereiten"
- "amtlich" -> nicht verwendet
- "offiziell" -> nicht verwendet

## Geanderte Dateien

```
apps/web/src/app/design-system/primitives/Badge.tsx
apps/web/src/app/app/components/AppShell.tsx
apps/web/src/app/app/page.tsx
apps/web/src/app/app/cases/[id]/wizard/WizardClient.tsx
apps/web/src/app/app/cases/[id]/summary/SummaryClient.tsx
apps/web/src/app/app/profile/ProfileClient.tsx
apps/web/src/app/app/billing/BillingClient.tsx
apps/web/src/app/page.tsx
apps/web/tests/setup.ts
apps/web/tests/dashboard.test.tsx
apps/web/tests/design-system.test.tsx
apps/web/tests/billing.test.tsx
apps/web/tests/app-ui.test.tsx
apps/web/tests/summary.test.tsx
apps/web/tests/cases-client.test.tsx
apps/web/tests/wizard.test.tsx
docs/UX/WORDING.md
```

## Abnahmekriterien

- [x] Alle benutzersichtbaren Texte gepruft
- [x] Verbotene Begriffe ersetzt
- [x] Tests aktualisiert
- [x] WORDING.md Dokumentation erstellt
- [x] Keine neuen Features eingefuhrt
