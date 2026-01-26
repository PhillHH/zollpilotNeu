import React from "react";
import { AdminShell } from "./components/AdminShell";
import { fetchSession, requireSession, requireAdmin } from "../lib/auth";

/**
 * Admin Layout - Protected by SYSTEM_ADMIN role.
 *
 * Server-side guard ensures:
 * 1. User is authenticated (redirects to /login if not)
 * 2. User has SYSTEM_ADMIN permissions (redirects to /app if not)
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const session = await fetchSession();
  requireSession(session);
  requireAdmin(session);

  return <AdminShell>{children}</AdminShell>;
}

