import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "zollpilot_session";
const API_BASE_URL =
  process.env.API_BASE_URL ?? "http://localhost:8000";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  // Backend-Logout aufrufen, falls Session existiert
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
      // Fehler beim Backend-Logout ignorieren - Cookie wird trotzdem gelöscht
    }
  }

  // Session-Cookie löschen
  cookieStore.delete(SESSION_COOKIE_NAME);

  // Zur Login-Seite weiterleiten
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"));
}

export async function POST() {
  // POST auch unterstützen für bessere Kompatibilität
  return GET();
}
