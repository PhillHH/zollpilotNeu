import React from "react";
import { AppShell } from "./components/AppShell";
import { fetchSession, requireSession } from "../lib/auth";

/**
 * App Layout - Protected by authentication.
 *
 * Server-side guard ensures:
 * 1. User is authenticated (redirects to /login if not)
 *
 * Note: This is a user-facing layout, not admin.
 * Admin routes are under /admin with separate SYSTEM_ADMIN checks.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const session = await fetchSession();
  requireSession(session);

  return <AppShell>{children}</AppShell>;
}
