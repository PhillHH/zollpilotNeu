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
              <strong>Growento UG (haftungsbeschränkt) i. G.</strong>
              <br />
              Hamburg
              <br />
              Deutschland
            </p>

            <p>
              <strong>Vertreten durch:</strong>
              <br />
              Phillip Rugullis (Geschäftsführer)
            </p>

            <h2>Kontakt</h2>
            <p>
              E-Mail: info@zollpilot.de
            </p>

            <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p>
              Phillip Rugullis
              <br />
              Hamburg
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

            <h2>Verbraucherstreitbeilegung</h2>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren
              vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>

            <h2>Haftungsausschluss</h2>
            <p>
              Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt.
              Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte
              können wir jedoch keine Gewähr übernehmen.
            </p>

            <h2>Hinweis zu ZollPilot</h2>
            <p>
              ZollPilot bereitet Zollanmeldungen vor. Die eigentliche Anmeldung
              führen Sie selbst durch – zum Beispiel über das IZA-Portal des
              Zolls oder bei der Zollstelle. ZollPilot übermittelt keine Daten
              an Zollbehörden.
            </p>
          </div>
        </Card>
      </Section>
    </PublicLayout>
  );
}
