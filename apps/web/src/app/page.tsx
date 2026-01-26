import type { Metadata } from "next";
import Link from "next/link";
import { PublicLayout } from "./components/PublicLayout";
import { Section } from "./design-system/primitives/Section";
import { Card } from "./design-system/primitives/Card";
import { Button } from "./design-system/primitives/Button";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "ZollPilot – Zollanmeldung einfach gemacht",
  description:
    "Spare 6–15 € pro Sendung: ZollPilot bereitet deine Zollanmeldung vor – du reichst sie selbst ein. Schnell, einfach, ohne Servicegebühren.",
  openGraph: {
    title: "ZollPilot – Zollanmeldung einfach gemacht",
    description:
      "Spare 6–15 € pro Sendung. Zollanmeldung selbst vorbereiten statt teuer bezahlen.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <PublicLayout>
      <HeroSection />
      <PdfGuideSection />
      <ComparisonSection />
      <HowItWorksSection />
      <CtaSection />
    </PublicLayout>
  );
}

/** Hero – Hauptbereich mit CTA */
function HeroSection() {
  return (
    <Section maxWidth="lg" padding="xl" className={styles.hero}>
      <div className={styles.heroContent}>
        <div className={styles.heroBadge}>Keine Servicegebühren mehr</div>
        <h1 className={styles.heroTitle}>
          Zollanmeldung vorbereiten.
          <br />
          <span className={styles.heroTitleAccent}>6–15 € sparen.</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Dein Paket aus dem Ausland hängt beim Zoll? ZollPilot zeigt dir in 5 Minuten,
          wie du die Anmeldung selbst vorbereitest – ohne teure Paketdienst-Gebühren.
        </p>
        <div className={styles.heroActions}>
          <Link href="/register">
            <Button variant="primary" size="lg">
              Jetzt starten – kostenlos
            </Button>
          </Link>
        </div>
        <div className={styles.heroTrust}>
          <span>✓ Kostenlose Registrierung</span>
          <span>✓ Daten in Deutschland</span>
          <span>✓ Kein Abo</span>
        </div>
      </div>
    </Section>
  );
}

/** PDF Guide Teaser */
function PdfGuideSection() {
  return (
    <Section maxWidth="lg" padding="lg" className={styles.pdfSection}>
      <Card padding="lg" className={styles.pdfCard}>
        <div className={styles.pdfContent}>
          <div className={styles.pdfIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div className={styles.pdfText}>
            <h3 className={styles.pdfTitle}>Zoll-Leitfaden als PDF</h3>
            <p className={styles.pdfDescription}>
              Alles Wichtige zur Selbstverzollung auf einen Blick: Formulare, Fristen, Freigrenzen.
              Direkt nach der Registrierung im Dashboard verfügbar.
            </p>
          </div>
          <div className={styles.pdfAction}>
            <Link href="/register">
              <Button variant="secondary" size="md">
                PDF freischalten
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </Section>
  );
}

/** Comparison – Paketdienst vs. ZollPilot */
function ComparisonSection() {
  return (
    <Section maxWidth="lg" padding="xl" className={styles.comparison}>
      <h2 className={styles.sectionTitle}>Paketdienst vs. Selbst machen</h2>

      <div className={styles.comparisonGrid}>
        <Card padding="lg" className={styles.comparisonCard}>
          <div className={styles.comparisonHeader}>
            <span className={styles.comparisonIcon}>📦</span>
            <h3>Paketdienst</h3>
          </div>
          <ul className={styles.comparisonList}>
            <li className={styles.comparisonNegative}>6–15 € Gebühr pro Sendung</li>
            <li className={styles.comparisonNegative}>Wartezeit bis zur Bearbeitung</li>
            <li className={styles.comparisonNegative}>Keine Kontrolle über den Prozess</li>
          </ul>
        </Card>

        <Card padding="lg" className={`${styles.comparisonCard} ${styles.comparisonHighlight}`}>
          <div className={styles.comparisonHeader}>
            <span className={styles.comparisonIcon}>✨</span>
            <h3>Mit ZollPilot</h3>
          </div>
          <ul className={styles.comparisonList}>
            <li className={styles.comparisonPositive}>Einmalig günstig, dann kostenlos</li>
            <li className={styles.comparisonPositive}>In 5 Minuten fertig vorbereitet</li>
            <li className={styles.comparisonPositive}>Daten für nächstes Mal gespeichert</li>
          </ul>
        </Card>
      </div>
    </Section>
  );
}

/** How it works – 3 Schritte */
function HowItWorksSection() {
  const steps = [
    {
      number: "1",
      title: "Daten eingeben",
      description: "Beantworte ein paar einfache Fragen zu deiner Sendung.",
    },
    {
      number: "2",
      title: "Ausfüllhilfe nutzen",
      description: "Übertrage die Werte ins offizielle Zollformular.",
    },
    {
      number: "3",
      title: "Selbst einreichen",
      description: "Fertig – du sparst die Servicegebühr.",
    },
  ];

  return (
    <Section maxWidth="lg" padding="xl" className={styles.howItWorks}>
      <h2 className={styles.sectionTitle}>In 3 Schritten zum Ziel</h2>

      <div className={styles.steps}>
        {steps.map((step, index) => (
          <div key={step.number} className={styles.step}>
            <div className={styles.stepNumber}>{step.number}</div>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepDescription}>{step.description}</p>
            {index < steps.length - 1 && <div className={styles.stepConnector} />}
          </div>
        ))}
      </div>

      <p className={styles.disclaimer}>
        ZollPilot bereitet deine Daten vor – die Einreichung beim Zoll machst du selbst.
      </p>
    </Section>
  );
}

/** Final CTA */
function CtaSection() {
  return (
    <Section maxWidth="md" padding="xl" className={styles.cta}>
      <div className={styles.ctaContent}>
        <h2 className={styles.ctaTitle}>
          Dein nächstes Paket wartet nicht.
        </h2>
        <p className={styles.ctaSubtitle}>
          Registriere dich jetzt und bereite deine erste Zollanmeldung vor.
        </p>
        <Link href="/register">
          <Button variant="primary" size="lg">
            Kostenlos starten
          </Button>
        </Link>
      </div>
    </Section>
  );
}
