"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Section } from "../../design-system/primitives/Section";
import { Card } from "../../design-system/primitives/Card";

export default function BlogPostError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Blog post error:", error);
  }, [error]);

  return (
    <Section maxWidth="md" padding="xl">
      <Card padding="lg">
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#333" }}>
            Artikel konnte nicht geladen werden
          </h1>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>
            Beim Laden dieses Artikels ist ein Fehler aufgetreten.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button
              onClick={() => reset()}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#6366f1",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Erneut versuchen
            </button>
            <Link
              href="/blog"
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#f3f4f6",
                color: "#333",
                borderRadius: "8px",
                textDecoration: "none",
              }}
            >
              Zurück zum Blog
            </Link>
          </div>
        </div>
      </Card>
    </Section>
  );
}
