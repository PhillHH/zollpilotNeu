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
    "ZollPilot hilft Ihnen, Ihre Zollanmeldung für Internetbestellungen aus dem Ausland schnell und einfach zu erledigen. Schritt für Schritt durch den Prozess.",
  openGraph: {
    title: "ZollPilot – Zollanmeldung einfach gemacht",
    description:
      "Zollanmeldung für Internetbestellungen. Einfach, schnell und rechtssicher.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <HeroSection />

      {/* Problem/Nutzen Section */}
      <FeaturesSection />

      {/* So funktioniert's */}
      <HowItWorksSection />

      {/* Vertrauen */}
      <TrustSection />

      {/* Final CTA */}
      <CtaSection />
    </PublicLayout>
  );
}

/** Hero – Hauptbereich mit CTA */
function HeroSection() {
  return (
    <Section maxWidth="lg" padding="xl" className={styles.hero}>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>
          Spare dir 6–15 € Verzollungsgebühren
          <br />
          <span className={styles.heroTitleAccent}>– bereite deine Zollanmeldung selbst vor.</span>
        </h1>
        <p className={styles.heroSubtitle}>
          ZollPilot führt dich Schritt für Schritt durch die <strong>Vorbereitung</strong> und zeigt dir genau,
          wo du was eintragen musst.
        </p>
        <div className={styles.heroActions}>
          <Link href="/register">
            <Button variant="primary" size="lg">
              Zollanmeldung vorbereiten
            </Button>
          </Link>
          <Link href="/faq">
            <Button variant="secondary" size="lg">
              Mehr erfahren
            </Button>
          </Link>
        </div>
      </div>
    </Section>
  );
}

/** Comparison – Paketdienst vs. ZollPilot */
function FeaturesSection() {
  return (
    <Section maxWidth="xl" padding="xl" className={styles.features}>
      <div className={styles.featuresHeader}>
        <h2 className={styles.featuresTitle}>Warum selbst vorbereiten statt bezahlen?</h2>
        <p className={styles.featuresSubtitle}>
          Holen Sie sich die Kontrolle zurück.
        </p>
      </div>

      <div className={styles.featuresGrid}>
        {/* Paketdienst */}
        <Card padding="lg" className={styles.featureCard}>
          <div className={styles.featureIcon}>📦</div>
          <h3 className={styles.featureTitle}>Paketdienst</h3>
          <p className={styles.featureDescription}>
            ❌ <strong>6–15 € Servicegebühr</strong> pro Sendung<br />
            ❌ Keine Wiederverwendung von Daten<br />
            ❌ Oft intransparente Abwicklung
          </p>
        </Card>

        {/* ZollPilot */}
        <Card padding="lg" className={styles.featureCard} style={{ borderColor: 'var(--color-primary)' }}>
          <div className={styles.featureIcon}>🚀</div>
          <h3 className={styles.featureTitle}>ZollPilot</h3>
          <p className={styles.featureDescription}>
            ✅ <strong>Kostenersparnis</strong> bei jeder Sendung<br />
            ✅ Einmal erfassen, immer wiederverwenden<br />
            ✅ Volle Kontrolle über Ihre Daten
          </p>
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
      title: "Fragen beantworten",
      description: "Unser Wizard führt dich durch alle notwendigen Angaben zur Sendung.",
    },
    {
      number: "2",
      title: "Werte kopieren & eintragen",
      description:
        "Nutze unsere Ausfüllhilfe, um die Daten in das offizielle Zollformular zu übertragen.",
    },
    {
      number: "3",
      title: "Fertig",
      description:
        "Reiche die Anmeldung selbst beim Zoll ein und spare die Servicegebühr.",
    },
  ];

  return (
    <Section maxWidth="lg" padding="xl">
      <div className={styles.howItWorksHeader}>
        <h2 className={styles.howItWorksTitle}>So funktioniert&apos;s</h2>
        <p className={styles.howItWorksSubtitle}>
          Einfach vorbereiten, selbst einreichen.
        </p>
      </div>

      <div className={styles.steps}>
        {steps.map((step, index) => (
          <div key={step.number} className={styles.step}>
            <div className={styles.stepNumber}>{step.number}</div>
            <div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
            </div>
            {index < steps.length - 1 && <div className={styles.stepConnector} />}
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "var(--space-lg)", color: "var(--color-text-muted)" }}>
        <small>Hinweis: ZollPilot übermittelt keine Daten an Zollbehörden.</small>
      </div>
    </Section>
  );
}

/** Trust Section */
function TrustSection() {
  return (
    <Section maxWidth="md" padding="xl" className={styles.trust}>
      <div className={styles.trustContent}>
        <h2 className={styles.trustTitle}>Vertrauen Sie auf ZollPilot</h2>
        <div className={styles.trustPoints}>
          <p>
            <strong>Rechtssicher:</strong> Unsere Übersichten orientieren sich an den gängigen
            Zollformularen und zeigen, wo welche Angaben einzutragen sind.
          </p>
          <p>
            <strong>Datenschutz:</strong> Ihre Daten werden ausschließlich in Deutschland
            gespeichert und niemals an Dritte weitergegeben.
          </p>
          <p>
            <strong>Transparent:</strong> Keine versteckten Kosten, keine Abonnements.
            Sie zahlen nur für das, was Sie nutzen.
          </p>
        </div>
      </div>
    </Section>
  );
}

/** Final CTA */
function CtaSection() {
  return (
    <Section maxWidth="md" padding="xl">
      <div className={styles.ctaContent}>
        <h2 className={styles.ctaTitle}>Behalte die Kontrolle – spare bei jeder Sendung.</h2>
        <p className={styles.ctaSubtitle}>
          Jetzt kostenlos registrieren und Zollanmeldung vorbereiten.
        </p>
        <Link href="/register">
          <Button variant="primary" size="lg">
            Kostenlos registrieren
          </Button>
        </Link>
      </div>
    </Section>
  );
}
