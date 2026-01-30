# Sprint 6A – C3: SEO-Basics, Vertrauen & Impressum

> **Status**: Abgeschlossen
> **Datum**: 2026-01-30

---

## Ziel

ZollPilot ist **SEO-ready, vertrauenswürdig und rechtlich sauber**, ohne Overengineering.

---

## Scope

### A) SEO-Grundlagen (Next.js)
- [x] Metadata für Startseite (bereits vorhanden)
- [x] Metadata für /blog (bereits vorhanden)
- [x] Metadata für /blog/[slug] (bereits vorhanden mit generateMetadata)
- [x] Metadata für /faq (bereits vorhanden)
- [x] H1 genau einmal pro Seite (geprüft: korrekt)

### B) Sitemap & Robots
- [x] Dynamische Sitemap mit statischen Seiten
- [x] Veröffentlichte Blogposts aus API
- [x] FAQ-Einzelseiten entfernt (keine /faq/[slug] mehr)
- [x] robots.txt blockiert Admin-/App-/API-Routen

### C) Vertrauen & Wording
- [x] Globaler Disclaimer im Footer:
  > „ZollPilot bereitet Zollanmeldungen vor. Die eigentliche Anmeldung führen Sie selbst durch."
- [x] Kein Behörden-Framing
- [x] Keine irreführenden Aussagen

### D) Impressum
- [x] Seite /impressum aktualisiert
- [x] Inhalte: Phillip Rugullis, Growento UG i. G., Hamburg, E-Mail
- [x] Produkthinweis eingefügt
- [x] Footer-Link bereits vorhanden

### E) Tests
- [x] Sitemap enthält /blog, /faq, veröffentlichte Artikel
- [x] Admin-Routen nicht in Sitemap
- [x] Impressum-Seite rendert korrekt

### F) Dokumentation
- [x] docs/CONTENT_GUIDE.md (SEO-Regeln erweitert)
- [x] docs/ARCHITECTURE.md (SEO/Meta-Layer + Vertrauen & Wording)
- [x] docs/LEGAL/IMPRESSUM.md (neu)

---

## Changed / Created Files

### Frontend

| Datei | Änderung |
|-------|----------|
| `apps/web/src/app/sitemap.ts` | API-basierte Sitemap, keine FAQ-Einzelseiten |
| `apps/web/src/app/components/PublicLayout.tsx` | Footer-Disclaimer aktualisiert |
| `apps/web/src/app/impressum/page.tsx` | Echte Unternehmensdaten, Produkthinweis |

### Tests

| Datei | Beschreibung |
|-------|--------------|
| `apps/web/tests/seo.test.ts` | Tests für Sitemap und robots.txt |
| `apps/web/tests/impressum.test.tsx` | Tests für Impressum-Seite |

### Dokumentation

| Datei | Änderung |
|-------|----------|
| `docs/CONTENT_GUIDE.md` | Technische SEO erweitert (Sitemap-Details, H1-Regeln) |
| `docs/ARCHITECTURE.md` | SEO-Implementierung + Vertrauen & Wording Sektion |
| `docs/LEGAL/IMPRESSUM.md` | Neue Datei: Rechtliche Dokumentation |
| `docs/sprints/sprint6/C3-seo-legal.md` | Dieser Sprint-Log |

---

## Gaps / Notes

### Bewusst nicht umgesetzt

1. **Schema.org Rich Snippets** – Geplant für späteren Sprint
2. **Structured Data (JSON-LD)** – Nicht im Scope
3. **OG-Images** – Keine benutzerdefinierten Open Graph Bilder
4. **Twitter Cards** – Nicht im Scope

### Technische Hinweise

1. **Sitemap-Revalidierung**: 1h Cache (`next: { revalidate: 3600 }`)
2. **API-Fallback**: Sitemap funktioniert auch wenn API nicht erreichbar
3. **FAQ-Architektur**: Keine Einzelseiten mehr – Antworten inline als Akkordeon

### WORDING_GUIDE Konformität

Der Footer-Disclaimer entspricht der Anforderung:
- Bisheriger Text: „ZollPilot übermittelt keine Daten an Zollbehörden..."
- Neuer Text: „ZollPilot bereitet Zollanmeldungen vor. Die eigentliche Anmeldung führen Sie selbst durch."

Beide Formulierungen sind laut WORDING_GUIDE korrekt. Der neue Text ist direkter und nutzerfreundlicher.

---

## Referenzen

- [WORDING_GUIDE.md](../../WORDING_GUIDE.md)
- [CONTENT_GUIDE.md](../../CONTENT_GUIDE.md)
- [ARCHITECTURE.md](../../ARCHITECTURE.md)
- [LEGAL/IMPRESSUM.md](../../LEGAL/IMPRESSUM.md)
