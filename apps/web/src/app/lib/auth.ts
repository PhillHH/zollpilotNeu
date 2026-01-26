import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { apiRequest, ApiError } from "./api/client";

export type AuthMeData = {
  user: { id: string; email: string };
  tenant: { id: string; name: string };
  role: "OWNER" | "ADMIN" | "USER";
  permissions: { can_access_admin: boolean };
};

type AuthMeResponse = {
  data: AuthMeData;
};

export async function fetchSession(): Promise<AuthMeData | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(
    process.env.SESSION_COOKIE_NAME ?? "zollpilot_session"
  );

  const cookieHeader = sessionCookie
    ? `${sessionCookie.name}=${sessionCookie.value}`
    : "";

  try {
    const response = await apiRequest<AuthMeResponse>("/auth/me", {
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
      cache: "no-store"
    });
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    if (apiError.status === 401) {
      return null;
    }
    throw error;
  }
}

export function requireSession(session: AuthMeData | null): asserts session is AuthMeData {
  if (!session) {
    redirect("/login");
  }
}

export function requireAdmin(session: AuthMeData) {
  if (!session.permissions.can_access_admin) {
    redirect("/app");
  }
}

