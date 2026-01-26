import type { Metadata } from "next";
import { PublicLayout } from "../components/PublicLayout";
import { Section } from "../design-system/primitives/Section";
import { Card } from "../design-system/primitives/Card";
import "../legal.css";

export const metadata: Metadata = {
  title: "Impressum – ZollPilot",
  description: "Impressum und Anbieterkennzeichnung von ZollPilot.",
  robots: { index: true, follow: true },
};

export default function ImpressumPage() {
  return (
    <PublicLayout>
      <Section maxWidth="md" padding="xl">
        <Card padding="lg">
          <h1 className="legal-page-title">Impressum</h1>

          <div className="legal-content legal-content--impressum">
            <h2>Angaben gemäß § 5 TMG</h2>
            <p>
              <strong>ZollPilot</strong>
              <br />
              Musterstraße 123
              <br />
              12345 Musterstadt
              <br />
              Deutschland
            </p>

            <h2>Kontakt</h2>
            <p>
              E-Mail: info@zollpilot.de
              <br />
              Telefon: +49 (0) 123 456789
            </p>

            <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p>
              Max Mustermann
              <br />
              Musterstraße 123
              <br />
              12345 Musterstadt
            </p>

            <h2>EU-Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur
              Online-Streitbeilegung (OS) bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p>
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>

            <h2>Haftungsausschluss</h2>
            <p>
              Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt.
              Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte
              können wir jedoch keine Gewähr übernehmen.
            </p>
          </div>
        </Card>
      </Section>
    </PublicLayout>
  );
}
