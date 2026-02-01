import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { apiRequest, ApiError } from "./api/client";

/**
 * User roles - matches backend Role enum.
 *
 * Hierarchy (highest to lowest):
 * - SYSTEM_ADMIN: ZollPilot internal, full system access
 * - OWNER: Tenant owner, full access within tenant
 * - ADMIN: Tenant administrator
 * - USER: Standard user
 */
export type Role = "SYSTEM_ADMIN" | "OWNER" | "ADMIN" | "USER";

export type AuthMeData = {
  user: { id: string; email: string };
  tenant: { id: string; name: string };
  role: Role;
  permissions: { can_access_admin: boolean };
};

type AuthMeResponse = {
  data: AuthMeData;
};

/**
 * Fetch current user session from API.
 * Returns null if not authenticated.
 */
export async function fetchSession(): Promise<AuthMeData | null> {
  const cookieStore = await cookies();
  const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "zollpilot_session";
  const sessionCookie = cookieStore.get(sessionCookieName);

  console.log(`[fetchSession] Looking for cookie '${sessionCookieName}'... Found:`, !!sessionCookie);
  if (sessionCookie) {
    console.log(`[fetchSession] Cookie value (preview): ${sessionCookie.value.substring(0, 10)}...`);
  }

  const cookieHeader = sessionCookie
    ? `${sessionCookie.name}=${sessionCookie.value}`
    : "";

  try {
    console.log("[fetchSession] Calling /auth/me API...");
    const response = await apiRequest<AuthMeResponse>("/auth/me", {
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
      cache: "no-store"
    });
    console.log("[fetchSession] API success:", response.data ? "User data returned" : "No data");
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    console.error("[fetchSession] API failed:", apiError.status, apiError.message);
    if (apiError.status === 401) {
      return null;
    }
    throw error;
  }
}

/**
 * Guard: Require authenticated session.
 * Redirects to /login if not authenticated.
 */
export function requireSession(session: AuthMeData | null): asserts session is AuthMeData {
  if (!session) {
    redirect("/login");
  }
}

/**
 * Guard: Require SYSTEM_ADMIN access.
 * Redirects to /app if user doesn't have admin permissions.
 */
export function requireAdmin(session: AuthMeData) {
  if (!session.permissions.can_access_admin) {
    redirect("/app");
  }
}

/**
 * Check if user is a system admin (based on permissions).
 */
export function isSystemAdmin(session: AuthMeData | null): boolean {
  return session?.permissions.can_access_admin ?? false;
}

/**
 * Check if user is at least a tenant admin (ADMIN or higher).
 */
export function isTenantAdmin(session: AuthMeData | null): boolean {
  if (!session) return false;
  return ["SYSTEM_ADMIN", "OWNER", "ADMIN"].includes(session.role);
}

