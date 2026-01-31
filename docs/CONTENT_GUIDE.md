# Content Guide

Anleitung zur Erstellung und Pflege von Inhalten für Blog und FAQ.

> **Stand**: Sprint 3 – Content-Fundament für Vertrauen, SEO & Skalierung

---

## Inhaltsverzeichnis

1. [Grundprinzipien](#grundprinzipien)
2. [Content-Typen](#content-typen)
3. [Schreibstil & Tonalität](#schreibstil--tonalität)
4. [Verbotene Aussagen](#verbotene-aussagen)
5. [Pflichthinweise](#pflichthinweise)
6. [Verzeichnisstruktur](#verzeichnisstruktur)
7. [Frontmatter-Spezifikation](#frontmatter-spezifikation)
8. [SEO-Guidelines](#seo-guidelines)
9. [Pricing & Argumentation](#pricing--argumentation)
10. [Content-Workflow](#content-workflow)
11. [Erweiterbarkeit](#erweiterbarkeit)

---

## Grundprinzipien

### Deutsch-First

**Alle sichtbaren Texte müssen auf Deutsch sein:**

- Titel und Beschreibungen
- Fließtext und Überschriften
- Buttons und Links
- Fehlermeldungen

**Technische Begriffe bleiben Englisch:**

- Dateinamen: `zollanmeldung-einfach-erklaert.mdx`
- Frontmatter-Keys: `title`, `slug`, `published_at`
- Code-Beispiele und technische Dokumentation

### Trennung: Erklärung vs. Anleitung vs. Produktgrenzen

| Typ | Zweck | Beispiel |
|-----|-------|----------|
| **Erklärung** | Was ist das? Hintergründe verstehen | „Was ist eine Zollanmeldung?" |
| **Anleitung** | Wie mache ich das? Schritte zeigen | „So bereitest du deine Daten vor" |
| **Produktgrenzen** | Was ZollPilot NICHT macht | „ZollPilot übermittelt keine Daten" |

Diese Trennung muss in jedem Artikel klar sein. Niemals Erklärungen mit falschen Produktversprechen vermischen.

---

## Content-Typen

### Blog

**Zweck**: Erklärung, Hintergründe, How-To-Artikel

| Eigenschaft | Beschreibung |
|-------------|--------------|
| Länge | 500–1500 Wörter |
| Frequenz | 2–4 Artikel/Monat (Ziel) |
| Fokus | Wissensvermittlung, SEO-Keywords |
| Tonalität | Informativ, ruhig, erklärend |

**Typische Blog-Themen:**
- Zollverfahren erklärt
- Wertgrenzen und Freibeträge
- Länderspezifische Besonderheiten (UK, USA, China)
- Steuerliche Hintergründe (EUSt, Zollsätze)

### Fachartikel (seit Sprint 6)

**Zweck**: Tiefgehende Problemlösung, SEO-Hebel, Conversion

| Eigenschaft | Beschreibung |
|-------------|--------------|
| Länge | 800–2000 Wörter |
| Struktur | Problem → Komplexität → Fehler → Lösung → ZollPilot-Hilfe |
| Fokus | Konkretes Problem lösen, Vertrauen aufbauen |
| Tonalität | Fachlich, ehrlich, hilfreich |

**Fachartikel-Struktur (6 Abschnitte):**

1. **Problemdefinition** – Was ist das Problem, wen betrifft es?
2. **Warum ist das schwierig?** – Hintergründe, Systemlogik
3. **Typische Fehler** – Was geht oft schief?
4. **Was Sie vorbereiten müssen** – Konkrete Checkliste
5. **Wie ZollPilot dabei unterstützt** – Neutral, nicht werblich
6. **CTA** – „Mit ZollPilot vorbereiten" (Link zu /register)

**Aktuelle Artikelserien:**

| Serie | Thema | Artikel |
|-------|-------|---------|
| IZA-Basics | Internet-Zollanmeldung für Privatpersonen | 5 Artikel |

Siehe [ARTICLE_SERIES_IZA.md](./CONTENT/ARTICLE_SERIES_IZA.md) für Details.

### FAQ

**Zweck**: Kurze, konkrete Antworten auf häufige Fragen

| Eigenschaft | Beschreibung |
|-------------|--------------|
| Länge | 100–400 Wörter |
| Struktur | Frage → Kurze Antwort → Details |
| Fokus | Problemorientiert, schnell erfassbar |
| Tonalität | Direkt, hilfreich, ehrlich |

**Typische FAQ-Kategorien:**

| Kategorie | Themen |
|-----------|--------|
| Allgemein | Was ist ZollPilot, wie funktioniert es |
| Zoll & Import | Wann brauche ich was, Dokumente |
| Kosten | Preise, Gebühren, Einsparungen |
| Produkt | Was ZollPilot kann und was nicht |
| Daten | Datenschutz, Speicherung |

#### FAQ – Stil & Pflichtformulierungen

**Aufbau einer FAQ-Antwort:**

1. **Kurze Antwort** (1 Satz, fett) – direkt auf die Frage
2. **Erklärung** (2–4 Sätze) – Kontext und Details
3. **Pflichthinweis** (wenn relevant) – dezent am Ende

**Beispiel:**

```markdown
## Führt ZollPilot die Zollanmeldung für mich durch?

**Nein.** ZollPilot ist ein Vorbereitungstool.

Wir führen Sie durch alle notwendigen Fragen und erstellen eine
Ausfüllhilfe. Die eigentliche Einreichung beim Zoll nehmen Sie
selbst vor.

> ZollPilot bereitet vor. Die Anmeldung führen Sie selbst durch.
```

**Kernfragen (Pflicht-FAQs):**

Diese 7 Fragen müssen beantwortet sein, um Kernmissverständnisse zu vermeiden:

| Frage | Kernaussage |
|-------|-------------|
| Was macht ZollPilot genau? | Vorbereitung, geführte Fragen, Ausfüllhilfe |
| Führt ZollPilot die Anmeldung durch? | Nein, Nutzer trägt selbst ein |
| Ist das PDF offiziell? | Nein, Ausfüllhilfe, kein amtliches Formular |
| Muss ich selbst eintragen? | Ja, Copy & Paste in offizielles Formular |
| Warum spare ich Geld? | Servicegebühr des Paketdienstes entfällt |
| Werden Daten übermittelt? | Nein, keine Schnittstelle zu Behörden |
| Für wen ist ZollPilot? | Privatpersonen, einzelne Sendungen |

**Verbotene Formulierungen in FAQ:**

- "ZollPilot erledigt das für Sie"
- "automatische Übermittlung"
- "amtlich", "offiziell", "rechtsgültig"
- "direkt an den Zoll"

**Pflichthinweise in FAQ:**

Jede produktbezogene FAQ sollte mit einem dezenten Hinweis enden:

> ZollPilot bereitet Zollanmeldungen vor. Die eigentliche Anmeldung führen Sie selbst durch.

Bei Fragen zu Daten oder Verantwortung zusätzlich:

> Die Richtigkeit der eingegebenen Daten liegt in Ihrer Verantwortung.

#### FAQ – zentrale Seite

**Seit Sprint 3 (P3p03_C5):** Alle FAQs werden auf einer zentralen Seite gebündelt.

**Datei:** `apps/web/content/faq/index.mdx`

**Struktur der zentralen FAQ:**

| Abschnitt | Themen |
|-----------|--------|
| Grundverständnis | Was ZollPilot macht/nicht macht, Produktgrenzen |
| Ablauf & Nutzung | Wie die Ausfüllhilfe funktioniert, Zeitaufwand |
| Kosten & Alternativen | Paketdienst-Gebühren, wann Dienstleister |
| Daten & Verantwortung | Speicherung, keine Übermittlung, Haftung |
| Zielgruppe & Grenzen | Für wen geeignet/nicht geeignet, Verfahren |

**Vorteile der zentralen FAQ:**

- Nutzer finden alle Antworten an einem Ort
- Bessere SEO durch gebündelte Inhalte
- Einfachere Pflege und Aktualisierung
- Konsistente Struktur und Tonalität

**Migration:** Bestehende Einzel-FAQs bleiben vorerst erhalten, werden aber nicht mehr erweitert. Die zentrale FAQ ist der Haupteinstiegspunkt.

### Statische Seiten

**Zweck**: Rechtliches, Über uns, Kontakt

- `/impressum` – Pflichtangaben
- `/datenschutz` – DSGVO-konform
- `/agb` – Falls benötigt (später)

Diese Seiten werden nicht als MDX verwaltet, sondern als Next.js-Seiten.

### Wissensbasis (Zukunft)

**Nicht in Sprint 3 umgesetzt.** Geplant für spätere Sprints:
- Strukturierte Wissensdatenbank
- AI-durchsuchbar
- Glossar-Funktion

---

## Schreibstil & Tonalität

### Grundregeln

| Regel | Beschreibung |
|-------|--------------|
| **Klar** | Kurze Sätze, aktive Sprache, keine Verschachtelungen |
| **Ruhig** | Kein Ausrufezeichen-Überfluss, keine Hype-Worte |
| **Erklärend** | Fachbegriffe einführen und erläutern |
| **Ehrlich** | Grenzen klar benennen, keine falschen Versprechen |

### Verboten

| Verboten | Problem |
|----------|---------|
| Amtsdeutsch | „Hiermit wird Ihnen mitgeteilt" → unlesbar |
| Marketing-Sprech | „Revolutionär", „Game-Changer" → unglaubwürdig |
| Übertreibungen | „Das beste Tool" → nicht beweisbar |
| Dringlichkeit | „Jetzt schnell!" → manipulativ |

### Beispiele

**Schlecht** ❌
> Mit ZollPilot erledigen Sie Ihre Zollanmeldung im Handumdrehen – unser revolutionäres Tool macht Sie zum Zoll-Profi!

**Gut** ✅
> ZollPilot unterstützt Sie bei der Vorbereitung Ihrer Zollanmeldung. Sie geben Ihre Daten ein, und wir erstellen eine Übersicht, die Sie als Ausfüllhilfe nutzen können.

---

## Verbotene Aussagen

Diese Aussagen dürfen **niemals** in Content auftauchen:

### Produktfunktion

| Verboten | Problem | Alternative |
|----------|---------|-------------|
| „ZollPilot erledigt die Anmeldung" | Falsch – wir führen nicht durch | „ZollPilot bereitet vor" |
| „ZollPilot meldet beim Zoll an" | Falsch – keine Übermittlung | „ZollPilot erstellt eine Ausfüllhilfe" |
| „direkt an den Zoll" | Falsch – keine Anbindung | Nicht verwenden |
| „ATLAS-Anbindung" | Falsch – wir nutzen kein ATLAS | Nicht erwähnen |

### Behördliche Begriffe

| Verboten | Problem | Alternative |
|----------|---------|-------------|
| „amtlich" | Wir sind kein Amt | Weglassen |
| „offiziell" | Suggeriert Behördenstatus | Weglassen |
| „behördlich anerkannt" | Nicht zutreffend | Weglassen |
| „rechtsgültig" | Nur Behörden können das | Weglassen |

### Vollständige Verbots-Liste

```
- „ZollPilot erledigt die Anmeldung"
- „durchführen" (bei Zollanmeldung)
- „einreichen" (bei Zollbehörde)
- „amtlich", „offiziell", „behördlich"
- „direkt an den Zoll"
- „ATLAS", „Zollbehörde" (im Kontext von Anbindung)
- „bereit für den Zoll"
- „Zollformular erstellen"
- „automatische Übermittlung"
- „rechtsgültige Anmeldung"
```

Siehe auch: [WORDING_GUIDE.md](./WORDING_GUIDE.md)

---

## Pflichthinweise

Diese Hinweise müssen **dezent aber klar** in relevanten Artikeln erscheinen:

### Standard-Disclaimer

> ZollPilot bereitet Zollanmeldungen vor. Die eigentliche Anmeldung führen Sie selbst durch – zum Beispiel über das IZA-Portal des Zolls oder bei der Zollstelle.

### Nutzer-Verantwortung

> Die Richtigkeit der eingegebenen Daten liegt in Ihrer Verantwortung. ZollPilot prüft die Plausibilität, aber nicht die inhaltliche Korrektheit.

### Wann einsetzen

| Kontext | Pflichthinweis |
|---------|----------------|
| Jeder Produktartikel | Standard-Disclaimer |
| FAQ „Was macht ZollPilot?" | Beide Hinweise |
| Blog über Zollverfahren | Standard-Disclaimer am Ende |
| Kosten-Artikel | Nur wenn ZollPilot erwähnt |

### Platzierung

- **Dezent**: Nicht als Banner oder Warnung
- **Am Ende**: Nach dem Hauptinhalt, vor dem CTA
- **Formatierung**: Als Blockquote oder Infobox

---

## Verzeichnisstruktur

```
apps/web/content/
├── blog/
│   ├── zollanmeldung-einfach-erklaert.mdx
│   ├── paket-beim-zoll-was-tun.mdx
│   ├── einfuhrumssatzsteuer-berechnen.mdx
│   └── warum-paketdienste-gebuehren-verlangen.mdx  # geplant
└── faq/
    ├── was-ist-zollpilot.mdx
    ├── was-macht-zollpilot-nicht.mdx               # geplant
    ├── warum-spare-ich-geld.mdx                    # geplant
    ├── muss-ich-daten-selbst-eintragen.mdx
    ├── datensicherheit-atlas.mdx
    ├── wann-zollanmeldung-noetig.mdx
    ├── was-kostet-zollanmeldung.mdx
    ├── welche-dokumente-brauche-ich.mdx
    ├── wie-lange-dauert-zoll.mdx
    ├── fuehrt-zollpilot-anmeldung-durch.mdx
    └── ist-pdf-offiziell.mdx
```

### Dateinamen-Konvention

- Lowercase mit Bindestrichen
- Deutsch, ohne Umlaute (ä→ae, ö→oe, ü→ue, ß→ss)
- Beschreibend, nicht zu lang
- Keine Datumsangaben im Dateinamen (Datum im Frontmatter)

---

## Frontmatter-Spezifikation

### Blog

```yaml
---
title: "Titel des Artikels"
description: "SEO-Beschreibung, 150-160 Zeichen ideal"
slug: "url-pfad-ohne-slashes"
published_at: "2026-01-15"
tags: ["Zoll", "Import", "Anleitung"]
---
```

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `title` | ✓ | Artikeltitel (H1) |
| `description` | ✓ | Meta-Description für SEO |
| `slug` | ✓ | URL-Pfad: `/blog/{slug}` |
| `published_at` | ✓ | ISO-Datum für Sortierung |
| `tags` | ○ | Array für Kategorisierung |

### FAQ

```yaml
---
title: "Frage als Titel?"
description: "Kurze Antwort / SEO-Beschreibung"
slug: "url-pfad"
published_at: "2026-01-15"
category: "Allgemein"
---
```

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `title` | ✓ | Frage als Überschrift |
| `description` | ✓ | Kurze Antwort für Vorschau |
| `slug` | ✓ | URL-Pfad: `/faq/{slug}` |
| `published_at` | ✓ | ISO-Datum |
| `category` | ○ | Kategorie für Gruppierung |

### Gültige Kategorien (FAQ)

- `Allgemein`
- `Zoll & Import`
- `Kosten`
- `Produkt`
- `Daten`

### Gültige Tags (Blog)

- `Zoll`, `Import`, `Export`
- `Anleitung`, `Tipps`
- `EUSt`, `Steuer`, `Berechnung`
- `UK`, `USA`, `China` (Länder)
- `Tracking`, `Dokumente`

---

## SEO-Guidelines

### Title

- Maximal 60 Zeichen
- Primäres Keyword enthalten
- Aussagekräftig und klickbar

**Gut**: „Zollanmeldung einfach erklärt – Was Sie wissen müssen"
**Schlecht**: „Blog Post 1"

### Description

- 150–160 Zeichen ideal
- Primäres Keyword enthalten
- Zusammenfassung des Inhalts
- Zum Klicken motivieren

**Gut**: „Alles zur Zollanmeldung bei Bestellungen aus dem Ausland: Wertgrenzen, Verfahren und wie ZollPilot Sie bei der Vorbereitung unterstützt."
**Schlecht**: „Ein Artikel über Zoll."

### Slug

- Lowercase
- Wörter mit Bindestrichen trennen
- Kurz aber beschreibend
- Primäres Keyword enthalten

**Gut**: `zollanmeldung-einfach-erklaert`
**Schlecht**: `blog-post-2026-01-15-zoll-anmeldung-einfach-erklaert-guide`

### Interne Verlinkung

- Relevante Blog-Artikel untereinander verlinken
- FAQ-Einträge auf Blog-Artikel verweisen
- App-Links nur am Ende als CTA

```markdown
Weitere Informationen finden Sie in unserem [FAQ](/faq).
Lesen Sie auch: [Einfuhrumsatzsteuer berechnen](/blog/einfuhrumssatzsteuer-berechnen)
```

### Technische SEO

Die technische SEO ist implementiert:

| Element | Status | Datei |
|---------|--------|-------|
| `sitemap.xml` | ✓ | `apps/web/src/app/sitemap.ts` |
| `robots.txt` | ✓ | `apps/web/src/app/robots.ts` |
| Meta-Tags | ✓ | Per-Page in `generateMetadata()` |
| Open Graph | ✓ | In Layout/Page-Metadaten |
| Canonical URLs | ✓ | Selbstreferenzierend |

**Sitemap-Generierung (seit Sprint 6):**
- Statische Seiten: `/`, `/blog`, `/faq`, `/impressum`, `/datenschutz`, `/login`, `/register`
- Dynamische Blog-Posts: Aus API (`/content/blog`) – nur PUBLISHED
- FAQ: Keine Einzelseiten, nur `/faq` (Antworten inline als Akkordeon)
- Revalidierung: Stündlich (1h Cache)

**Robots.txt Regeln:**
- Erlaubt: `/`, `/blog`, `/blog/*`, `/faq`, `/faq/*`
- Blockiert: `/app`, `/app/*`, `/admin`, `/admin/*`, `/api`, `/api/*`

**H1-Regeln:**
- Genau eine H1 pro Seite
- H1 muss den Hauptinhalt beschreiben
- Keine H1-Duplikate im Header oder Footer

---

## Content-Cluster & interne Verlinkung

> **Seit Sprint 3 (P3p04_C6):** Strukturierte Content-Architektur für SEO und spätere AI-Nutzbarkeit.

### Die 7 Content-Cluster

| # | Cluster | Beschreibung | Zielgruppe |
|---|---------|--------------|------------|
| 1 | **Grundlagen & Orientierung** | Einstieg: Was ist Zoll, wann brauche ich das | Anfänger |
| 2 | **IZA in der Praxis** | Formular ausfüllen, Zolltarife, Zollamt | Aktive Anmelder |
| 3 | **ATLAS & Zollsoftware** | Atlas-Bedienung, Login, Navigation | Atlas-Nutzer |
| 4 | **Kosten, Zeit & Alternativen** | Gebühren, EUSt, Dienstleister-Vergleich | Entscheider |
| 5 | **Fehler, Risiken & Rettung** | Abstürze, Backups, Hotline | Problemlöser |
| 6 | **Hardware, Setup & Effizienz** | Multi-Monitor, Vorlagen, Kopierfunktion | Power-User |
| 7 | **Sonderfälle & Ausland** | UK/Brexit, Währungen, Länder | Spezialfälle |

### Hub-Seiten

Jedes Cluster hat 1–2 Hub-Seiten, die als zentrale Anlaufstelle dienen:

| Cluster | Hub-Seite(n) |
|---------|--------------|
| Übergreifend | FAQ (`/faq`) |
| 1. Grundlagen | `was-ist-eine-zollanmeldung` |
| 2. IZA | `ezt-online-zolltarif-suche-anleitung` |
| 3. ATLAS | `atlas-zoll-software-anleitung-privatpersonen` |
| 4. Kosten | `zollagent-kosten-nutzen-privatpersonen` |
| 5. Fehler | `zoll-hotline-kurzanleitung-hilfe-anmeldung` |
| 6. Setup | `multi-monitor-setup-zollanmeldung-effizienz` |
| 7. Sonderfälle | `post-brexit-uk-einkauf-zoll-anmeldung` |

### Verlinkungsregeln

**Pflicht:**

- Max. 3–5 interne Links pro Artikel
- Hub-Artikel verlinken alle Cluster-Artikel
- Cluster-Artikel verlinken zurück auf ihren Hub
- Alle Grundlagen-Artikel verlinken zur FAQ

**Verboten:**

- Querverweise ohne inhaltlichen Bezug
- Link-Ketten ohne Kontext (A → B → C)
- Selbstreferenzen
- Links zu Draft-Artikeln

### Link-Matrix nach Cluster

| Von Cluster | Verlinkt typischerweise zu |
|-------------|---------------------------|
| 1. Grundlagen | FAQ, Cluster 2, Cluster 4 |
| 2. IZA | Cluster 1 (Hub), Cluster 3, Cluster 5 |
| 3. ATLAS | Cluster 2, Cluster 5, Cluster 6 |
| 4. Kosten | FAQ, Cluster 1 (Hub) |
| 5. Fehler | Cluster 3, Cluster 2 |
| 6. Setup | Cluster 3, Cluster 2 |
| 7. Sonderfälle | Cluster 1 (Hub), Cluster 4 |

### FAQ-Anbindung

Die FAQ dient als:
- **Grundlagen-Hub** für neue Nutzer
- **Vertrauensanker** für Produktverständnis
- **SEO-Bündelung** für Kernfragen

**FAQ → Blog:** Weiterführende Links zu Detailartikeln
**Blog → FAQ:** Rückverweis bei Produktbezug (Cluster 1 Pflicht)

---

## Pricing & Argumentation

### Preisargumentation

Unser stärkstes Argument ist die **Kostenersparnis**:

- Paketdienste verlangen oft **6–15 €** (manchmal mehr) als „Auslagepauschale" oder „Verzollungsservice"
- ZollPilot ermöglicht die **Selbstverzollung**, wodurch diese Gebühr entfällt

### Erlaubte Vergleiche

| Status | Aussage |
|--------|---------|
| ✓ Erlaubt | „Spare dir die Servicegebühr des Paketdienstes." |
| ✓ Erlaubt | „Bereite die Anmeldung selbst vor und vermeide Fremdkosten." |
| ✓ Erlaubt | „Paketdienste berechnen oft eine Verzollungspauschale." |
| ✗ Verboten | „ZollPilot ist billiger als der Zoll." |
| ✗ Verboten | „Wir übernehmen die Verzollung für dich." |
| ✗ Verboten | „Keine Zollgebühren mehr!" |

### Wichtiger Unterschied

- **Zollgebühren** = Steuer (unvermeidbar, durch uns nicht beeinflussbar)
- **Servicegebühr** = Paketdienst-Aufschlag (vermeidbar durch Selbstverzollung)

---

## Content-Workflow

### Neuen Content erstellen

1. `.mdx`-Datei im passenden Verzeichnis erstellen
2. Vollständiges Frontmatter hinzufügen
3. Content nach diesem Guide schreiben
4. Lokal testen: `npm run dev`
5. Prüfen:
   - Rendert korrekt
   - Links funktionieren
   - SEO-Tags vorhanden (View Source)
   - Keine verbotenen Aussagen
6. Commit und Push
7. Auf Staging/Production verifizieren

### Content aktualisieren

1. `.mdx`-Datei bearbeiten
2. `published_at` aktualisieren bei signifikanten Änderungen
3. Lokal testen
4. Mit beschreibendem Commit pushen

### Content löschen

1. `.mdx`-Datei löschen
2. Auf kaputte interne Links prüfen
3. Redirect einrichten falls Seite Traffic hatte

### Review-Checkliste

- [ ] Titel unter 60 Zeichen
- [ ] Description 150–160 Zeichen
- [ ] Keine verbotenen Aussagen
- [ ] Pflichthinweis wo nötig
- [ ] Interne Links funktionieren
- [ ] Rechtschreibung geprüft

---

## Erweiterbarkeit

### MDX-Komponenten (Zukunft)

Das Content-System ist für Custom MDX-Komponenten vorbereitet:

```tsx
// Geplant: apps/web/src/components/mdx/
<Callout type="info">
  Wichtiger Hinweis hier
</Callout>

<ProductBoundary>
  ZollPilot übermittelt keine Daten an Zollbehörden.
</ProductBoundary>
```

### AI/Wissensbasis (Zukunft)

Content ist so strukturiert, dass er später für:
- AI-Chatbot-Training
- Semantische Suche
- Automatische Antwortgenerierung

genutzt werden kann. Dafür wichtig:
- Klare Frontmatter-Struktur
- Konsistente Kategorisierung
- Trennung von Erklärung/Anleitung/Grenzen

### Internationalisierung (Zukunft)

Vorbereitet für mehrsprachigen Content:

```
apps/web/content/
├── de/
│   ├── blog/
│   └── faq/
└── en/                 # Später
    ├── blog/
    └── faq/
```

---

## Referenzen

- [WORDING_GUIDE.md](./WORDING_GUIDE.md) – Erlaubte/verbotene Begriffe
- [ARCHITECTURE.md](./ARCHITECTURE.md) – Content & SEO Layer
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) – UI-Komponenten für Content

---

*Zuletzt aktualisiert: Sprint 3 (P3p01)*
