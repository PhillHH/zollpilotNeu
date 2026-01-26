# Design System

ZollPilot Design System v1 – Dokumentation für UI-Tokens und Primitives.

---

## Design-Ziel

**Stilrichtung:** Ruhig, modern, SaaS/GovTech  
**Ästhetik:** Viel Weißraum, klare Hierarchie, professionell  
**Sprache:** Deutsch-first (alle UI-Texte)

Das Design System ist vollständig austauschbar durch Anpassung der CSS-Variablen.

---

## Struktur

```
apps/web/src/app/design-system/
├── tokens.css          # Alle Design-Tokens (Farben, Typo, Spacing)
├── base.css            # Reset, Typografie-Defaults, Utilities
├── index.ts            # Export-Datei
└── primitives/         # UI-Komponenten
    ├── index.ts
    ├── Button.tsx
    ├── Badge.tsx
    ├── Card.tsx
    ├── Alert.tsx
    ├── Section.tsx
    ├── PageShell.tsx
    └── Stepper.tsx
```

---

## Token-Liste

### Farben

| Token | Wert | Verwendung |
|-------|------|------------|
| `--color-bg` | `#fafbfc` | Haupthintergrund |
| `--color-surface` | `#ffffff` | Karten, Panels |
| `--color-primary` | `#10b981` | Primärfarbe (Grün) |
| `--color-primary-hover` | `#059669` | Primär Hover |
| `--color-primary-soft` | `#d1fae5` | Primär Hintergrund |
| `--color-primary-softer` | `#ecfdf5` | Primär Hover BG |
| `--color-text` | `#1f2937` | Haupttext |
| `--color-text-muted` | `#6b7280` | Sekundärer Text |
| `--color-text-light` | `#9ca3af` | Tertiärer Text |
| `--color-border` | `#e5e7eb` | Standard-Rahmen |
| `--color-danger` | `#ef4444` | Fehler (Rot) |
| `--color-warning` | `#f59e0b` | Warnung (Gelb) |
| `--color-success` | `#10b981` | Erfolg (Grün) |
| `--color-info` | `#3b82f6` | Info (Blau) |

### Typografie

| Token | Wert | Verwendung |
|-------|------|------------|
| `--font-sans` | Inter, system-ui | Standard-Schrift |
| `--font-mono` | JetBrains Mono | Code |
| `--text-xs` | 0.75rem (12px) | Kleinster Text |
| `--text-sm` | 0.875rem (14px) | Klein |
| `--text-base` | 1rem (16px) | Standard |
| `--text-lg` | 1.125rem (18px) | Groß |
| `--text-xl` | 1.25rem (20px) | Extra Groß |
| `--text-2xl` | 1.5rem (24px) | H3 |
| `--text-3xl` | 1.875rem (30px) | H1 |
| `--heading-h1` | `var(--text-3xl)` | Überschrift 1 |
| `--heading-h2` | `var(--text-2xl)` | Überschrift 2 |
| `--heading-h3` | `var(--text-xl)` | Überschrift 3 |
| `--heading-h4` | `var(--text-lg)` | Überschrift 4 |

### Spacing

| Token | Wert | Verwendung |
|-------|------|------------|
| `--space-xs` | 0.25rem (4px) | Minimal |
| `--space-sm` | 0.5rem (8px) | Klein |
| `--space-md` | 1rem (16px) | Standard |
| `--space-lg` | 1.5rem (24px) | Groß |
| `--space-xl` | 2rem (32px) | Extra Groß |
| `--space-2xl` | 3rem (48px) | Sehr Groß |
| `--space-3xl` | 4rem (64px) | Maximum |

### Border Radius

| Token | Wert | Verwendung |
|-------|------|------------|
| `--radius-sm` | 4px | Kleine Elemente |
| `--radius-md` | 8px | Standard (Buttons, Inputs) |
| `--radius-lg` | 12px | Karten |
| `--radius-xl` | 16px | Große Karten |
| `--radius-full` | 9999px | Rund (Badges, Avatare) |

### Schatten

| Token | Wert | Verwendung |
|-------|------|------------|
| `--shadow-sm` | Subtle | Kleine Erhöhung |
| `--shadow-md` | Medium | Standard-Karten |
| `--shadow-lg` | Large | Modals, Dropdowns |
| `--shadow-soft` | Very subtle | Ruhige Karten |

---

## UI Primitives

### Button

```tsx
import { Button } from '@/app/design-system';

// Varianten
<Button variant="primary">Speichern</Button>
<Button variant="secondary">Abbrechen</Button>
<Button variant="ghost">Mehr</Button>
<Button variant="danger">Löschen</Button>

// Größen
<Button size="sm">Klein</Button>
<Button size="md">Standard</Button>
<Button size="lg">Groß</Button>

// Zustände
<Button loading>Lädt...</Button>
<Button disabled>Deaktiviert</Button>
<Button fullWidth>Volle Breite</Button>
```

### Badge

```tsx
import { Badge } from '@/app/design-system';

// Mit Status (automatische deutsche Übersetzung)
<Badge status="draft" />      // → "Entwurf"
<Badge status="submitted" />  // → "Eingereicht"
<Badge status="archived" />   // → "Archiviert"

// Mit Variante
<Badge variant="primary">Neu</Badge>
<Badge variant="success">Aktiv</Badge>
<Badge variant="warning">Warnung</Badge>
<Badge variant="danger">Fehler</Badge>
```

### Card

```tsx
import { Card } from '@/app/design-system';

// Einfache Karte
<Card>Inhalt</Card>

// Mit Titel und Beschreibung
<Card
  title="Kartentitel"
  description="Beschreibung der Karte"
>
  Inhalt
</Card>

// Klickbare Karte
<Card onClick={() => handleClick()} hoverable>
  Klicken zum Öffnen
</Card>
```

### Alert

```tsx
import { Alert } from '@/app/design-system';

// Varianten (mit deutschen Standard-Titeln)
<Alert variant="info">Hinweis-Text</Alert>      // Titel: "Hinweis"
<Alert variant="success">Erfolg</Alert>          // Titel: "Erfolgreich"
<Alert variant="warning">Warnung</Alert>         // Titel: "Achtung"
<Alert variant="error">Fehlermeldung</Alert>     // Titel: "Fehler"

// Eigener Titel
<Alert variant="info" title="Wichtig">Benutzerdefinierter Titel</Alert>

// Schließbar
<Alert dismissible onDismiss={() => setShow(false)}>
  Diese Meldung kann geschlossen werden.
</Alert>
```

### Section

```tsx
import { Section } from '@/app/design-system';

// Standard-Section
<Section>Inhalt mit Standard-Breite</Section>

// Breite anpassen
<Section maxWidth="sm">Schmal</Section>
<Section maxWidth="lg">Standard</Section>
<Section maxWidth="xl">Breit</Section>
<Section maxWidth="full">Volle Breite</Section>

// Padding anpassen
<Section padding="none">Kein Padding</Section>
<Section padding="xl">Extra Padding</Section>
```

### PageShell

```tsx
import { PageShell } from '@/app/design-system';

<PageShell
  header={<HeaderComponent />}
  footer={<FooterComponent />}
>
  <main>Hauptinhalt</main>
</PageShell>
```

### Stepper

```tsx
import { Stepper, type Step } from '@/app/design-system';

const steps: Step[] = [
  { id: 'step1', label: 'Paketdaten', status: 'completed' },
  { id: 'step2', label: 'Absender', status: 'active' },
  { id: 'step3', label: 'Empfänger', status: 'pending' },
  { id: 'step4', label: 'Zusammenfassung', status: 'pending' },
];

<Stepper
  steps={steps}
  currentStep="step2"
  orientation="horizontal"
  onStepClick={(stepId) => navigate(stepId)}
/>
```

---

## Austauschbarkeit (Rebranding)

Das Design System ist vollständig über CSS-Variablen konfigurierbar.

### 1. Farben anpassen

Überschreibe die Tokens in einer eigenen CSS-Datei:

```css
/* custom-theme.css */
:root {
  /* Neue Primärfarbe (z.B. Blau) */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-primary-soft: #dbeafe;
  --color-primary-softer: #eff6ff;
  
  /* Neue Branding-Farben */
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
}
```

### 2. Dark Mode aktivieren

```tsx
// In der App
<html data-theme="dark">
```

Die Dark-Mode-Variablen sind bereits in `tokens.css` definiert.

### 3. Schriftart ändern

```css
:root {
  --font-sans: "Neue Haas Grotesk", -apple-system, sans-serif;
}
```

### 4. Komplett neues Theme

Erstelle eine neue `tokens-brand.css`:

```css
@import './tokens.css';

/* Brand-spezifische Überschreibungen */
:root {
  --color-primary: #your-brand-color;
  /* ... */
}
```

---

## Deutsch-First

Alle sichtbaren UI-Texte sind auf Deutsch:

| Komponente | Deutsch |
|------------|---------|
| Badge (draft) | "Entwurf" |
| Badge (submitted) | "Eingereicht" |
| Badge (archived) | "Archiviert" |
| Alert (info) | "Hinweis" |
| Alert (success) | "Erfolgreich" |
| Alert (warning) | "Achtung" |
| Alert (error) | "Fehler" |
| Alert dismiss | "Schließen" |
| Stepper | "Fortschritt" |

**Interne Codes bleiben Englisch:**
- CSS-Klassen: `.btn--primary`
- Props: `variant="primary"`
- Status-Werte: `status="draft"`

---

## Best Practices

### 1. Tokens nutzen, nicht Hardcoden

```css
/* ❌ Falsch */
.my-component {
  color: #1f2937;
  padding: 16px;
}

/* ✅ Richtig */
.my-component {
  color: var(--color-text);
  padding: var(--space-md);
}
```

### 2. Primitives verwenden

```tsx
// ❌ Falsch: Eigenen Button bauen
<button className="my-button">Speichern</button>

// ✅ Richtig: Primitive nutzen
<Button variant="primary">Speichern</Button>
```

### 3. Fokus-Styles nicht entfernen

Alle interaktiven Elemente haben `:focus-visible` Styles für Barrierefreiheit.

---

*Stand: Sprint 2, Prompt 16*

