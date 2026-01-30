# Impressum – Rechtliche Dokumentation

> **Zuletzt aktualisiert**: Sprint 6 (C3-seo-legal)

---

## Übersicht

Das Impressum ist eine gesetzlich vorgeschriebene Anbieterkennzeichnung gemäß § 5 TMG (Telemediengesetz). Es muss auf allen kommerziellen Websites in Deutschland leicht erreichbar sein.

---

## Unternehmensangaben

| Feld | Wert |
|------|------|
| **Firmenname** | Growento UG (haftungsbeschränkt) i. G. |
| **Rechtsform** | Unternehmergesellschaft (haftungsbeschränkt) in Gründung |
| **Geschäftsführer** | Phillip Rugullis |
| **Standort** | Hamburg, Deutschland |
| **E-Mail** | info@zollpilot.de |

---

## Rechtliche Pflichtangaben

### § 5 TMG – Anbieterkennzeichnung

Die Seite `/impressum` enthält alle Pflichtangaben gemäß § 5 Telemediengesetz:

1. Name und Anschrift des Unternehmens
2. Vertretungsberechtigte Person (Geschäftsführer)
3. Kontaktmöglichkeit (E-Mail)
4. Verantwortlicher für den Inhalt nach § 55 Abs. 2 RStV

### EU-Streitschlichtung

Link zur OS-Plattform der Europäischen Kommission:
https://ec.europa.eu/consumers/odr/

### Verbraucherstreitbeilegung

Hinweis auf Nicht-Teilnahme an Schlichtungsverfahren gemäß § 36 VSBG.

---

## Produkthinweis

Das Impressum enthält einen klaren Hinweis zu den Produktgrenzen:

> ZollPilot bereitet Zollanmeldungen vor. Die eigentliche Anmeldung führen Sie selbst durch – zum Beispiel über das IZA-Portal des Zolls oder bei der Zollstelle. ZollPilot übermittelt keine Daten an Zollbehörden.

Dieser Hinweis dient der Haftungsabgrenzung und verhindert Missverständnisse über die Produktfunktion.

---

## Implementation

### Dateipfad

```
apps/web/src/app/impressum/page.tsx
```

### Erreichbarkeit

Das Impressum ist erreichbar:

- **URL**: `/impressum`
- **Footer-Link**: Auf allen öffentlichen Seiten
- **Sitemap**: Enthalten mit `changeFrequency: yearly`
- **SEO**: `robots: { index: true, follow: true }`

### Metadata

```typescript
export const metadata: Metadata = {
  title: "Impressum – ZollPilot",
  description: "Impressum und Anbieterkennzeichnung von ZollPilot.",
  robots: { index: true, follow: true },
};
```

---

## Aktualisierung

Bei Änderungen der Unternehmensdaten muss das Impressum aktualisiert werden:

1. `apps/web/src/app/impressum/page.tsx` bearbeiten
2. Diese Dokumentation aktualisieren
3. Änderungen committen und deployen

**Wichtig**: Impressumsangaben müssen aktuell und korrekt sein. Falsche oder fehlende Angaben können zu Abmahnungen führen.

---

## Verwandte Dokumente

- [WORDING_GUIDE.md](../WORDING_GUIDE.md) – Erlaubte/verbotene Begriffe
- [CONTENT_GUIDE.md](../CONTENT_GUIDE.md) – Pflichthinweise für Content
- [ARCHITECTURE.md](../ARCHITECTURE.md) – SEO-Implementierung
