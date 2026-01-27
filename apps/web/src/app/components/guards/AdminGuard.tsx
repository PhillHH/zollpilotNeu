"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Section } from "../../design-system/primitives/Section";
import { Card } from "../../design-system/primitives/Card";
import { Button } from "../../design-system/primitives/Button";
import { apiRequest, type ApiError } from "../../lib/api/client";

type AuthMeData = {
  permissions: { can_access_admin: boolean };
  role: string;
};

type AuthMeResponse = {
  data: AuthMeData;
};

type AdminGuardProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/**
 * Client-side guard for admin-only content.
 *
 * Shows a friendly 403 message instead of crashing when:
 * - User is authenticated but lacks SYSTEM_ADMIN permissions
 *
 * For server-side protection, use the layout guard in /admin/layout.tsx
 */
export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthMeData | null | "loading">("loading");

  useEffect(() => {
    async function checkAuth() {
      try {
        // Use apiRequest which properly forwards cookies via server action
        const response = await apiRequest<AuthMeResponse>("/auth/me");
        setAuth(response.data);
      } catch (error) {
        // Auth failures (401) or other errors -> not authenticated
        const apiError = error as ApiError;
        if (apiError.status === 401) {
          setAuth(null);
        } else {
          // Log unexpected errors but treat as unauthenticated
          console.error("Auth check failed:", apiError);
          setAuth(null);
        }
      }
    }

    checkAuth();
  }, []);

  // Loading state
  if (auth === "loading") {
    return fallback ?? <LoadingState />;
  }

  // Not authenticated
  if (auth === null) {
    router.push("/login");
    return null;
  }

  // Authenticated but not admin
  if (!auth.permissions.can_access_admin) {
    return <ForbiddenState role={auth.role} />;
  }

  // Has admin access
  return <>{children}</>;
}

function LoadingState() {
  return (
    <Section maxWidth="sm" padding="xl">
      <Card padding="lg" style={{ textAlign: "center" }}>
        <p style={{ color: "var(--color-text-muted)" }}>
          Berechtigungen werden geprüft...
        </p>
      </Card>
    </Section>
  );
}

function ForbiddenState({ role }: { role: string }) {
  return (
    <Section maxWidth="sm" padding="xl">
      <Card padding="lg" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "var(--space-md)" }}>
          🔒
        </div>
        <h2
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: "var(--font-bold)",
            color: "var(--color-text)",
            marginBottom: "var(--space-sm)",
          }}
        >
          Keine Berechtigung
        </h2>
        <p
          style={{
            color: "var(--color-text-muted)",
            marginBottom: "var(--space-lg)",
          }}
        >
          Du bist eingeloggt, hast aber keine Administratorrechte.
        </p>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-light)",
            marginBottom: "var(--space-lg)",
          }}
        >
          Deine Rolle: <strong>{role}</strong>
          <br />
          Erforderlich: <strong>SYSTEM_ADMIN</strong>
        </p>
        <Button
          variant="primary"
          onClick={() => (window.location.href = "/app")}
        >
          Zur App
        </Button>
      </Card>
    </Section>
  );
}
