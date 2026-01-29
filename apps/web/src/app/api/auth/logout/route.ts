import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "zollpilot_session";
const API_BASE_URL =
  process.env.API_BASE_URL ?? "http://localhost:8000";

/**
 * GET: Safe redirect only - NO side effects
 * This prevents accidental logout from Link prefetching
 */
export async function GET() {
  return NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000")
  );
}

/**
 * POST: Actual logout with side effects
 * - Calls backend logout
 * - Deletes session cookie
 * - Returns JSON response (frontend handles redirect)
 */
export async function POST() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  // Call backend logout if session exists
  if (sessionCookie?.value) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "X-Contract-Version": "1",
          Cookie: `${SESSION_COOKIE_NAME}=${sessionCookie.value}`,
        },
      });
    } catch {
      // Ignore backend logout errors - cookie will be deleted anyway
    }
  }

  // Delete session cookie
  cookieStore.delete(SESSION_COOKIE_NAME);

  return NextResponse.json({ success: true });
}
