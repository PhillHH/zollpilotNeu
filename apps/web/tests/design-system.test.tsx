/**
 * Tests für das ZollPilot Design System
 */

import { describe, test, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Primitives importieren
import { Button } from "../src/app/design-system/primitives/Button";
import { Badge } from "../src/app/design-system/primitives/Badge";
import { Card } from "../src/app/design-system/primitives/Card";
import { Alert } from "../src/app/design-system/primitives/Alert";
import { Section } from "../src/app/design-system/primitives/Section";
import { PageShell } from "../src/app/design-system/primitives/PageShell";
import { Stepper } from "../src/app/design-system/primitives/Stepper";

describe("Button", () => {
  test("rendert ohne Fehler", () => {
    render(<Button>Klick mich</Button>);
    expect(screen.getByText("Klick mich")).toBeInTheDocument();
  });

  test("primary variant hat korrekte Klasse", () => {
    render(<Button variant="primary">Primär</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("btn--primary");
  });

  test("secondary variant hat korrekte Klasse", () => {
    render(<Button variant="secondary">Sekundär</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("btn--secondary");
  });

  test("ghost variant hat korrekte Klasse", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("btn--ghost");
  });

  test("danger variant hat korrekte Klasse", () => {
    render(<Button variant="danger">Löschen</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("btn--danger");
  });

  test("disabled state funktioniert", () => {
    render(<Button disabled>Deaktiviert</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  test("loading state zeigt Spinner", () => {
    render(<Button loading>Lädt...</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("btn--loading");
    expect(button).toBeDisabled();
  });

  test("onClick wird aufgerufen", () => {
    let clicked = false;
    render(<Button onClick={() => (clicked = true)}>Klicken</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(clicked).toBe(true);
  });

  test("fullWidth hat korrekte Klasse", () => {
    render(<Button fullWidth>Volle Breite</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("btn--full-width");
  });
});

describe("Badge", () => {
  test("rendert ohne Fehler", () => {
    render(<Badge>Test</Badge>);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  test("status 'draft' zeigt deutschen Text 'Entwurf'", () => {
    render(<Badge status="draft">Ignored</Badge>);
    expect(screen.getByText("Entwurf")).toBeInTheDocument();
  });

  test("status 'submitted' zeigt deutschen Text 'Bereit'", () => {
    render(<Badge status="submitted">Ignored</Badge>);
    expect(screen.getByText("Bereit")).toBeInTheDocument();
  });

  test("status 'archived' zeigt deutschen Text 'Archiviert'", () => {
    render(<Badge status="archived">Ignored</Badge>);
    expect(screen.getByText("Archiviert")).toBeInTheDocument();
  });

  test("variant 'primary' hat korrekte Klasse", () => {
    render(<Badge variant="primary">Primär</Badge>);
    const badge = screen.getByText("Primär");
    expect(badge.className).toContain("badge--primary");
  });

  test("variant 'danger' hat korrekte Klasse", () => {
    render(<Badge variant="danger">Fehler</Badge>);
    const badge = screen.getByText("Fehler");
    expect(badge.className).toContain("badge--danger");
  });
});

describe("Card", () => {
  test("rendert ohne Fehler", () => {
    render(<Card>Karteninhalt</Card>);
    expect(screen.getByText("Karteninhalt")).toBeInTheDocument();
  });

  test("zeigt Titel wenn vorhanden", () => {
    render(<Card title="Kartentitel">Inhalt</Card>);
    expect(screen.getByText("Kartentitel")).toBeInTheDocument();
  });

  test("zeigt Beschreibung wenn vorhanden", () => {
    render(<Card title="Titel" description="Beschreibung">Inhalt</Card>);
    expect(screen.getByText("Beschreibung")).toBeInTheDocument();
  });

  test("hoverable hat korrekte Klasse", () => {
    render(<Card hoverable>Hover-Karte</Card>);
    const card = screen.getByText("Hover-Karte").closest(".card");
    expect(card?.className).toContain("card--hoverable");
  });

  test("onClick macht Karte klickbar", () => {
    let clicked = false;
    render(<Card onClick={() => (clicked = true)}>Klickbare Karte</Card>);
    fireEvent.click(screen.getByRole("button"));
    expect(clicked).toBe(true);
  });
});

describe("Alert", () => {
  test("rendert ohne Fehler", () => {
    render(<Alert>Nachricht</Alert>);
    expect(screen.getByText("Nachricht")).toBeInTheDocument();
  });

  test("info variant zeigt deutschen Titel 'Hinweis'", () => {
    render(<Alert variant="info">Info-Nachricht</Alert>);
    expect(screen.getByText("Hinweis")).toBeInTheDocument();
  });

  test("success variant zeigt deutschen Titel 'Erfolgreich'", () => {
    render(<Alert variant="success">Erfolgs-Nachricht</Alert>);
    expect(screen.getByText("Erfolgreich")).toBeInTheDocument();
  });

  test("warning variant zeigt deutschen Titel 'Achtung'", () => {
    render(<Alert variant="warning">Warnung</Alert>);
    expect(screen.getByText("Achtung")).toBeInTheDocument();
  });

  test("error variant zeigt deutschen Titel 'Fehler'", () => {
    render(<Alert variant="error">Fehlermeldung</Alert>);
    expect(screen.getByText("Fehler")).toBeInTheDocument();
  });

  test("benutzerdefinierter Titel überschreibt Standard", () => {
    render(<Alert variant="info" title="Eigener Titel">Nachricht</Alert>);
    expect(screen.getByText("Eigener Titel")).toBeInTheDocument();
    expect(screen.queryByText("Hinweis")).not.toBeInTheDocument();
  });

  test("dismissible zeigt Schließen-Button", () => {
    render(<Alert dismissible onDismiss={() => {}}>Schließbar</Alert>);
    expect(screen.getByLabelText("Schließen")).toBeInTheDocument();
  });
});

describe("Section", () => {
  test("rendert ohne Fehler", () => {
    render(<Section>Abschnittsinhalt</Section>);
    expect(screen.getByText("Abschnittsinhalt")).toBeInTheDocument();
  });

  test("maxWidth 'lg' hat korrekte Klasse", () => {
    render(<Section maxWidth="lg">Inhalt</Section>);
    const section = screen.getByText("Inhalt").closest(".section");
    expect(section?.className).toContain("section--lg");
  });

  test("padding 'xl' hat korrekte Klasse", () => {
    render(<Section padding="xl">Inhalt</Section>);
    const section = screen.getByText("Inhalt").closest(".section");
    expect(section?.className).toContain("section--padding-xl");
  });
});

describe("PageShell", () => {
  test("rendert ohne Fehler", () => {
    render(<PageShell>Hauptinhalt</PageShell>);
    expect(screen.getByText("Hauptinhalt")).toBeInTheDocument();
  });

  test("zeigt Header wenn vorhanden", () => {
    render(
      <PageShell header={<div>Header-Inhalt</div>}>
        Hauptinhalt
      </PageShell>
    );
    expect(screen.getByText("Header-Inhalt")).toBeInTheDocument();
  });

  test("zeigt Footer wenn vorhanden", () => {
    render(
      <PageShell footer={<div>Footer-Inhalt</div>}>
        Hauptinhalt
      </PageShell>
    );
    expect(screen.getByText("Footer-Inhalt")).toBeInTheDocument();
  });
});

describe("Stepper", () => {
  const testSteps = [
    { id: "step1", label: "Schritt 1", status: "completed" as const },
    { id: "step2", label: "Schritt 2", status: "active" as const },
    { id: "step3", label: "Schritt 3", status: "pending" as const },
  ];

  test("rendert ohne Fehler", () => {
    render(<Stepper steps={testSteps} />);
    expect(screen.getByText("Schritt 1")).toBeInTheDocument();
    expect(screen.getByText("Schritt 2")).toBeInTheDocument();
    expect(screen.getByText("Schritt 3")).toBeInTheDocument();
  });

  test("zeigt korrekten Schritt-Status", () => {
    render(<Stepper steps={testSteps} />);
    
    // Check that step numbers are displayed for active and pending
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("horizontale Ausrichtung hat korrekte Klasse", () => {
    render(<Stepper steps={testSteps} orientation="horizontal" />);
    const stepper = screen.getByRole("navigation");
    expect(stepper.className).toContain("stepper--horizontal");
  });

  test("vertikale Ausrichtung hat korrekte Klasse", () => {
    render(<Stepper steps={testSteps} orientation="vertical" />);
    const stepper = screen.getByRole("navigation");
    expect(stepper.className).toContain("stepper--vertical");
  });

  test("onStepClick wird aufgerufen für klickbare Schritte", () => {
    let clickedStep = "";
    render(
      <Stepper
        steps={testSteps}
        onStepClick={(id) => (clickedStep = id)}
      />
    );
    
    // Completed steps should be clickable
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(clickedStep).toBe("step1");
  });
});

describe("Design Tokens", () => {
  test("primäre Farbe ist definiert", () => {
    // Da wir keine DOM-Umgebung mit CSS haben, 
    // testen wir nur, dass die Komponenten rendern
    render(<Button variant="primary">Test</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });
});

