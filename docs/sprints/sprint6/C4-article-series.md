# Sprint 6B – C4: Artikelserie (IZA / IPK / IAA) als Produkt-Hebel

> **Status**: Abgeschlossen
> **Datum**: 2026-01-30

---

## Ziel

Aufbau einer **fachlich starken Artikelserie**, die:
- Vertrauen schafft
- Suchtraffic bringt
- direkt auf ZollPilot einzahlt (Conversion)
- zukünftige Verfahren vorbereitet (IAA / IPK)

---

## Scope

### A) Artikelstruktur
- [x] 6-Abschnitte-Struktur definiert
- [x] Problem → Komplexität → Fehler → Vorbereitung → ZollPilot → CTA
- [x] WORDING_GUIDE konform (keine verbotenen Begriffe)

### B) Erstellte Artikel

| # | Titel | Slug |
|---|-------|------|
| 1 | Die 150-Euro-Falle | `iza-150-euro-grenze-privatpersonen` |
| 2 | ATLAS und IZA erklärt | `atlas-iza-zollsystem-erklaerung` |
| 3 | Warennummern und EZT | `warennummern-ezt-online-anleitung` |
| 4 | Versandkosten und Zollwert | `versandkosten-zollwert-rechenfehler` |
| 5 | Selbst oder Dienstleister? | `iza-selbst-machen-oder-dienstleister` |

### C) SEO

| Artikel | Fokus-Keyword | Meta-Title (< 60 Zeichen) |
|---------|---------------|---------------------------|
| #1 | IZA 150 Euro | IZA ab 150 Euro – Wann Privatpersonen verzollen müssen |
| #2 | ATLAS IZA | ATLAS & IZA erklärt – So funktioniert das Zollsystem |
| #3 | Warennummer EZT | Warennummer finden – EZT Online Anleitung für Anfänger |
| #4 | Zollwert berechnen | Zollwert berechnen – Versandkosten richtig einkalkulieren |
| #5 | IZA selbst Dienstleister | IZA selbst oder Dienstleister – Was lohnt sich? |

### D) Frontend
- [x] Artikel unter `/blog/{slug}` erreichbar
- [x] Kategorie-Tags: IZA, Grundlagen, Fehler vermeiden
- [x] Lesefreundlich (Absätze, Listen, Tabellen)

### E) Tests
- [x] Artikel-Struktur validiert
- [x] SEO-Anforderungen geprüft
- [x] WORDING_GUIDE Konformität

### F) Dokumentation
- [x] docs/CONTENT_GUIDE.md (Fachartikel-Typ hinzugefügt)
- [x] docs/CONTENT/ARTICLE_SERIES_IZA.md (neu)

---

## Created Content

### Artikel

| Slug | Wörter (ca.) | Status |
|------|--------------|--------|
| `iza-150-euro-grenze-privatpersonen` | 600 | PUBLISHED |
| `atlas-iza-zollsystem-erklaerung` | 700 | PUBLISHED |
| `warennummern-ezt-online-anleitung` | 750 | PUBLISHED |
| `versandkosten-zollwert-rechenfehler` | 800 | PUBLISHED |
| `iza-selbst-machen-oder-dienstleister` | 700 | PUBLISHED |

### Seed-Skript

```bash
python -m scripts.seed_articles
```

---

## Changed / Created Files

### Content

| Datei | Beschreibung |
|-------|--------------|
| `scripts/seed_articles.py` | Seed-Skript für 5 Fachartikel |

### Tests

| Datei | Beschreibung |
|-------|--------------|
| `apps/web/tests/articles.test.ts` | Struktur- und SEO-Tests |

### Dokumentation

| Datei | Änderung |
|-------|----------|
| `docs/CONTENT_GUIDE.md` | Fachartikel-Typ hinzugefügt |
| `docs/CONTENT/ARTICLE_SERIES_IZA.md` | Neue Datei: Artikelserie-Dokumentation |
| `docs/sprints/sprint6/C4-article-series.md` | Dieser Sprint-Log |

---

## Gaps / Notes

### IPK/IAA nur vorbereitet

Die Serien für IPK und IAA sind in der Dokumentation erwähnt, aber noch nicht umgesetzt:

- **IPK-Grundlagen** (Privatpersonen) – geplant
- **IAA-Überblick** (Kleinunternehmen) – geplant

### Interne Verlinkung

Die Artikel enthalten noch keine expliziten internen Links zueinander. Dies sollte nach der ersten Veröffentlichung ergänzt werden.

### FAQ-Verlinkung

FAQ-Einträge sollten auf die passenden Artikel verlinken:

| FAQ-Frage | Verlinkter Artikel |
|-----------|-------------------|
| "Was ist eine IZA?" | #2 (ATLAS & IZA) |
| "Ab wann muss ich Zoll zahlen?" | #1 (150 Euro) |
| "Was kostet die Zollanmeldung?" | #5 (Dienstleister) |

### Schema.org

Rich Snippets für Artikel (Article, HowTo) sind nicht implementiert – geplant für späteren Sprint.

---

## Referenzen

- [CONTENT_GUIDE.md](../../CONTENT_GUIDE.md)
- [WORDING_GUIDE.md](../../WORDING_GUIDE.md)
- [CONTENT/ARTICLE_SERIES_IZA.md](../../CONTENT/ARTICLE_SERIES_IZA.md)
