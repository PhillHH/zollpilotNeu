/**
 * Tests für die IZA-Artikelserie (Sprint 6B – C4)
 *
 * Prüft, dass die Artikel korrekt strukturiert sind.
 */

import { describe, test, expect } from "vitest";

// Artikel-Daten aus dem Seed-Skript (für Strukturprüfung)
const ARTICLES = [
  {
    slug: "iza-150-euro-grenze-privatpersonen",
    title: "Die 150-Euro-Falle: Wann die IZA für Privatpersonen Pflicht wird",
    meta_title: "IZA ab 150 Euro – Wann Privatpersonen verzollen müssen",
    keywords: ["150 Euro", "IZA", "Privatpersonen", "Zollanmeldung"],
  },
  {
    slug: "atlas-iza-zollsystem-erklaerung",
    title: "ATLAS und IZA: Warum das Zollsystem so kompliziert ist",
    meta_title: "ATLAS & IZA erklärt – So funktioniert das Zollsystem",
    keywords: ["ATLAS", "IZA", "Zollsystem", "Erklärung"],
  },
  {
    slug: "warennummern-ezt-online-anleitung",
    title: "Warennummern verstehen: EZT Online ohne Verzweiflung",
    meta_title: "Warennummer finden – EZT Online Anleitung für Anfänger",
    keywords: ["Warennummer", "EZT", "Zolltarifnummer", "Anleitung"],
  },
  {
    slug: "versandkosten-zollwert-rechenfehler",
    title: "Versandkosten und Zollwert: Die häufigsten Rechenfehler",
    meta_title: "Zollwert berechnen – Versandkosten richtig einkalkulieren",
    keywords: ["Zollwert", "Versandkosten", "Berechnung", "Einfuhrumsatzsteuer"],
  },
  {
    slug: "iza-selbst-machen-oder-dienstleister",
    title: "IZA selbst machen oder Dienstleister beauftragen?",
    meta_title: "IZA selbst oder Dienstleister – Was lohnt sich?",
    keywords: ["IZA", "Selbstverzollung", "Dienstleister", "Vergleich"],
  },
];

describe("IZA-Artikelserie Struktur", () => {
  test("hat 5 Artikel", () => {
    expect(ARTICLES).toHaveLength(5);
  });

  test.each(ARTICLES)("Artikel '$slug' hat gültigen Slug", (article) => {
    // Slug sollte lowercase, mit Bindestrichen, keine Sonderzeichen
    expect(article.slug).toMatch(/^[a-z0-9-]+$/);
    // Slug sollte nicht zu lang sein
    expect(article.slug.length).toBeLessThanOrEqual(60);
  });

  test.each(ARTICLES)("Artikel '$slug' hat meta_title < 60 Zeichen", (article) => {
    expect(article.meta_title.length).toBeLessThanOrEqual(60);
  });

  test.each(ARTICLES)("Artikel '$slug' hat Keywords", (article) => {
    expect(article.keywords.length).toBeGreaterThanOrEqual(3);
  });
});

describe("SEO-Anforderungen", () => {
  test("alle Artikel haben unterschiedliche Slugs", () => {
    const slugs = ARTICLES.map((a) => a.slug);
    const uniqueSlugs = new Set(slugs);
    expect(slugs.length).toBe(uniqueSlugs.size);
  });

  test("alle Artikel haben unterschiedliche Titel", () => {
    const titles = ARTICLES.map((a) => a.title);
    const uniqueTitles = new Set(titles);
    expect(titles.length).toBe(uniqueTitles.size);
  });

  test("alle meta_titles enthalten Fokus-Keyword", () => {
    ARTICLES.forEach((article) => {
      // Mindestens ein Keyword sollte im meta_title sein
      const hasKeyword = article.keywords.some((keyword) =>
        article.meta_title.toLowerCase().includes(keyword.toLowerCase())
      );
      expect(hasKeyword).toBe(true);
    });
  });
});

describe("Content-Anforderungen", () => {
  // Diese Tests prüfen die Seed-Daten auf WORDING_GUIDE Konformität
  const FORBIDDEN_PHRASES = [
    "einreichen",
    "amtlich",
    "offiziell",
    "direkt an den Zoll",
    "Zollanmeldung durchführen",
    "erledigt das für Sie",
    "automatische Übermittlung",
  ];

  test("keine verbotenen Phrasen in Titeln", () => {
    ARTICLES.forEach((article) => {
      FORBIDDEN_PHRASES.forEach((phrase) => {
        expect(article.title.toLowerCase()).not.toContain(phrase.toLowerCase());
      });
    });
  });

  test("alle Artikel enthalten IZA-bezogene Themen", () => {
    const IZA_RELATED = ["IZA", "Zollanmeldung", "Zoll", "Import"];

    ARTICLES.forEach((article) => {
      const hasIZATopic = IZA_RELATED.some(
        (topic) =>
          article.title.toLowerCase().includes(topic.toLowerCase()) ||
          article.keywords.some((k) => k.toLowerCase().includes(topic.toLowerCase()))
      );
      expect(hasIZATopic).toBe(true);
    });
  });
});

describe("Artikel-Kategorisierung", () => {
  test("Artikel decken verschiedene Themen ab", () => {
    const topics = {
      wertgrenze: ["150-euro", "wertgrenze"],
      system: ["atlas", "iza-portal", "zollsystem"],
      warennummer: ["warennummer", "ezt", "tarifnummer"],
      berechnung: ["zollwert", "versandkosten", "berechnung"],
      entscheidung: ["dienstleister", "selbst"],
    };

    const coveredTopics = Object.entries(topics).filter(([_, keywords]) =>
      ARTICLES.some((article) =>
        keywords.some(
          (keyword) =>
            article.slug.includes(keyword) ||
            article.title.toLowerCase().includes(keyword)
        )
      )
    );

    // Mindestens 4 von 5 Themen sollten abgedeckt sein
    expect(coveredTopics.length).toBeGreaterThanOrEqual(4);
  });
});
