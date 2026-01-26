# Content Guide

Anleitung zur Erstellung und Pflege von Inhalten für Blog und FAQ.

---

## Grundprinzip: Deutsch-First

**Alle sichtbaren Texte müssen auf Deutsch sein:**

- Titel und Beschreibungen
- Fließtext und Überschriften
- Buttons und Links
- Fehlermeldungen

## 5. Pricing & Argumentation

### Preisargumentation
Unser stärkstes Argument ist die **Kostenersparnis**.
- Paketdienste verlangen oft **6–15 €** (manchmal mehr) "Auslagepauschale" oder "Verzollungsservice".
- ZollPilot ermöglicht die **Selbstverzollung**, wodurch diese Gebühr entfällt.

### Erlaubte Vergleiche
- **Erlaubt:** "Spare dir die Servicegebühr des Paketdienstes."
- **Erlaubt:** "Bereite die Anmeldung selbst vor und vermeide Fremdkosten."
- **Verboten:** "ZollPilot ist billiger als der Zoll." (Zollgebühren sind Steuer, die ändern sich nicht).
- **Verboten:** "Wir übernehmen die Verzollung für dich." (Falsches Versprechen).

---

**Technische Begriffe bleiben Englisch:**

- Dateinamen: `zollanmeldung-einfach-erklaert.mdx`
- Frontmatter-Keys: `title`, `slug`, `published_at`
- Code-Beispiele und technische Dokumentation

---

## Overview

Content is stored as MDX files in the repository:

```
apps/web/content/
├── blog/           # Blog articles
└── faq/            # FAQ entries
```

MDX allows mixing Markdown with React components for rich, interactive content.

## File Naming

- Use lowercase letters, numbers, and hyphens
- File name does not affect URL (slug in frontmatter does)
- Examples: `zollanmeldung-einfach-erklaert.mdx`, `was-ist-zollpilot.mdx`

## Frontmatter

Every content file must start with YAML frontmatter:

### Blog Frontmatter

```yaml
---
title: "Your Article Title"
description: "SEO-friendly description (150-160 chars ideal)"
slug: "url-friendly-slug"
published_at: "2026-01-15"
tags: ["Zoll", "Import", "Anleitung"]
---
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | ✓ | Article title (H1 in page) |
| `description` | ✓ | Meta description for SEO |
| `slug` | ✓ | URL path: `/blog/{slug}` |
| `published_at` | ✓ | ISO date for sorting and display |
| `tags` | ○ | Array of tags for categorization |

### FAQ Frontmatter

```yaml
---
title: "Question title (FAQ entry)"
description: "Short answer / SEO description"
slug: "url-friendly-slug"
published_at: "2026-01-15"
category: "Allgemein"
---
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | ✓ | Question text |
| `description` | ✓ | Short answer / meta description |
| `slug` | ✓ | URL path: `/faq/{slug}` |
| `published_at` | ✓ | ISO date for sorting |
| `category` | ○ | Category for grouping (e.g., "Allgemein", "Zoll & Import", "Kosten") |

## Markdown Features

### Headings

```markdown
# H1 – Page title (usually from frontmatter)
## H2 – Major sections
### H3 – Subsections
```

**Note**: Only use H1 once per article (it's generated from title).

### Text Formatting

```markdown
**Bold text** for emphasis
*Italic text* for slight emphasis
`inline code` for technical terms
[Link text](/path) for internal links
[External link](https://example.com) for external
```

### Lists

```markdown
Unordered:
- Item one
- Item two
  - Nested item

Ordered:
1. First step
2. Second step
3. Third step
```

### Blockquotes

```markdown
> **Important**: This is a highlighted note.
> Use for warnings or key information.
```

### Code Blocks

````markdown
```
Plain code block
```

```javascript
// Syntax-highlighted code
const greeting = "Hello";
```
````

### Tables

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
| Value 4  | Value 5  | Value 6  |
```

### Horizontal Rule

```markdown
---
```

## SEO Guidelines

### Title

- Keep under 60 characters
- Include primary keyword
- Make it compelling

**Good**: "Zollanmeldung einfach erklärt: Was Sie beim Import wissen müssen"
**Bad**: "Blog Post 1"

### Description

- 150-160 characters ideal
- Include primary keyword
- Summarize the content
- Encourage click-through

**Good**: "Alles, was Sie über die Zollanmeldung bei Internetbestellungen aus dem Ausland wissen müssen. Von der Wertgrenze bis zum richtigen Verfahren."
**Bad**: "Ein Artikel über Zoll."

### Slug

- Use lowercase
- Separate words with hyphens
- Keep concise but descriptive
- Include primary keyword

**Good**: `zollanmeldung-einfach-erklaert`
**Bad**: `blog-post-2026-01-15-zoll-anmeldung-einfach-erklaert-guide`

### Tags (Blog)

- Use 2-4 tags per post
- Be consistent with existing tags
- Use title case

**Existing tags**: Zoll, Import, Anleitung, Steuer, EUSt, Berechnung, Tracking, Tipps

### Categories (FAQ)

- Use consistent category names
- Group related questions together

**Existing categories**: Allgemein, Zoll & Import, Kosten, Dokumente

## Internal Linking

Link to other content and app pages:

```markdown
Weitere Informationen finden Sie in unserem [FAQ](/faq).

Mit ZollPilot können Sie [Ihre Zollanmeldung starten](/app).

Lesen Sie auch: [Einfuhrumsatzsteuer berechnen](/blog/einfuhrumssatzsteuer-berechnen)
```

## Call-to-Actions

End articles with a CTA:

```markdown
---

Mit ZollPilot können Sie Ihre Zollanmeldung in wenigen Minuten online erledigen. [Jetzt starten →](/app)
```

## Content Workflow

### Adding New Content

1. Create `.mdx` file in appropriate directory
2. Add complete frontmatter
3. Write content following this guide
4. Test locally: `npm run dev`
5. Verify:
   - Content renders correctly
   - Links work
   - SEO tags present (view source)
6. Commit and push
7. Verify on staging/production

### Updating Existing Content

1. Edit the `.mdx` file
2. Update `published_at` if significant changes
3. Test locally
4. Commit with descriptive message

### Deleting Content

1. Delete the `.mdx` file
2. Check for broken internal links
3. Consider redirect if page had traffic

## Sitemap

The sitemap is automatically generated at `/sitemap.xml` and includes:

- Static pages: `/`, `/blog`, `/faq`, `/login`, `/register`
- Dynamic content: All blog posts and FAQ entries

**Not included** (via robots.txt):
- `/app/*` (authenticated)
- `/admin/*` (authenticated)
- `/api/*` (API endpoints)

## Examples

### Example Blog Post

```markdown
---
title: "Zollanmeldung einfach erklärt"
description: "Alles, was Sie über die Zollanmeldung bei Internetbestellungen wissen müssen."
slug: "zollanmeldung-einfach-erklaert"
published_at: "2026-01-15"
tags: ["Zoll", "Import", "Anleitung"]
---

# Zollanmeldung einfach erklärt

Wenn Sie online im Ausland bestellen, kann es sein, dass Ihr Paket durch den Zoll muss.

## Wann brauche ich eine Zollanmeldung?

Eine Zollanmeldung ist erforderlich, wenn:

- Ihr Paket aus einem **Nicht-EU-Land** kommt
- Der **Warenwert über 150 Euro** liegt

> **Tipp**: Bewahren Sie immer die Rechnung Ihrer Bestellung auf.

---

Mit ZollPilot können Sie Ihre Zollanmeldung einfach online erledigen. [Jetzt starten →](/app)
```

### Example FAQ Entry

```markdown
---
title: "Was kostet eine Zollanmeldung?"
description: "Übersicht über die Kosten bei der Zollabfertigung."
slug: "was-kostet-zollanmeldung"
published_at: "2026-01-04"
category: "Kosten"
---

# Was kostet eine Zollanmeldung?

Bei der Einfuhr von Waren aus Nicht-EU-Ländern fallen verschiedene Kosten an.

## Übersicht der Abgaben

| Abgabe | Beschreibung |
|--------|--------------|
| Zollgebühren | 0-17% je nach Ware |
| Einfuhrumsatzsteuer | 19% (oder 7%) |

## ZollPilot Kosten

Die Nutzung von ZollPilot ist kostenlos. Für den PDF-Export wird 1 Credit benötigt.
```

