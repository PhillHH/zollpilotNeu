import type { Metadata } from "next";
import { PublicLayout } from "../components/PublicLayout";
import { Section } from "../design-system/primitives/Section";
import { Card } from "../design-system/primitives/Card";
import "../legal.css";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – ZollPilot",
  description:
    "Datenschutzerklärung von ZollPilot. Informationen zur Erhebung und Verarbeitung personenbezogener Daten.",
  robots: { index: true, follow: true },
};

export default function DatenschutzPage() {
  return (
    <PublicLayout>
      <Section maxWidth="md" padding="xl">
        <Card padding="lg">
          <h1 className="legal-page-title">Datenschutzerklärung</h1>

          <div className="legal-content">
            <h2>1. Datenschutz auf einen Blick</h2>

            <h3>Allgemeine Hinweise</h3>
            <p>
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was
              mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website
              besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie
              persönlich identifiziert werden können.
            </p>

            <h3>Datenerfassung auf dieser Website</h3>
            <p>
              <strong>
                Wer ist verantwortlich für die Datenerfassung auf dieser Website?
              </strong>
            </p>
            <p>
              Die Datenverarbeitung auf dieser Website erfolgt durch den
              Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum
              dieser Website entnehmen.
            </p>

            <h2>2. Hosting</h2>
            <p>
              Wir hosten die Inhalte unserer Website bei folgendem Anbieter:
            </p>
            <p>
              Die Server befinden sich in Deutschland. Weitere Informationen
              hierzu sowie zu Ihren Widerspruchsmöglichkeiten gegenüber dem
              Hosting-Anbieter finden Sie in der Datenschutzerklärung des
              Anbieters.
            </p>

            <h2>3. Allgemeine Hinweise und Pflichtinformationen</h2>

            <h3>Datenschutz</h3>
            <p>
              Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen
              Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten
              vertraulich und entsprechend den gesetzlichen
              Datenschutzvorschriften sowie dieser Datenschutzerklärung.
            </p>

            <h3>Hinweis zur verantwortlichen Stelle</h3>
            <p>
              Die verantwortliche Stelle für die Datenverarbeitung auf dieser
              Website ist:
            </p>
            <p>
              ZollPilot
              <br />
              Musterstraße 123
              <br />
              12345 Musterstadt
              <br />
              E-Mail: info@zollpilot.de
            </p>

            <h2>4. Datenerfassung auf dieser Website</h2>

            <h3>Cookies</h3>
            <p>
              Unsere Internetseiten verwenden sogenannte „Cookies". Cookies sind
              kleine Textdateien und richten auf Ihrem Endgerät keinen Schaden
              an. Sie werden entweder vorübergehend für die Dauer einer Sitzung
              (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem
              Endgerät gespeichert.
            </p>

            <h3>Server-Log-Dateien</h3>
            <p>
              Der Provider der Seiten erhebt und speichert automatisch
              Informationen in so genannten Server-Log-Dateien, die Ihr Browser
              automatisch an uns übermittelt.
            </p>

            <h2>5. Ihre Rechte</h2>
            <p>
              Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre
              gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger
              und den Zweck der Datenverarbeitung sowie ein Recht auf
              Berichtigung oder Löschung dieser Daten.
            </p>

            <p className="legal-note">
              <em>
                Hinweis: Dies ist ein Platzhalter. Die vollständige
                Datenschutzerklärung sollte von einem Rechtsexperten erstellt
                werden.
              </em>
            </p>
          </div>
        </Card>
      </Section>
    </PublicLayout>
  );
}
