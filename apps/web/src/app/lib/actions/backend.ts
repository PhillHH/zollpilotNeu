"use server";

import { cookies } from "next/headers";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000";

export type BackendRequestInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

type BackendJsonResult = {
  ok: boolean;
  status: number;
  requestId: string | null;
  body: string;
};

type BackendBinaryResult = {
  ok: boolean;
  status: number;
  requestId: string | null;
  bodyBase64: string;
  contentDisposition: string | null;
  contentType: string | null;
};

async function buildCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  const pairs = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`);
  return pairs.join("; ");
}

async function applySetCookies(setCookies: string[]): Promise<void> {
  if (setCookies.length === 0) return;
  const cookieStore = await cookies();

  for (const cookie of setCookies) {
    const parts = cookie.split(";").map((part) => part.trim());
    const [nameValue, ...attributes] = parts;
    if (!nameValue) continue;

    const [name, ...valueParts] = nameValue.split("=");
    if (!name) continue;
    const value = valueParts.join("=");

    const options: {
      path?: string;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: "lax" | "strict" | "none";
      domain?: string;
      expires?: Date;
      maxAge?: number;
    } = {};

    for (const attribute of attributes) {
      const [attrKeyRaw, attrValueRaw] = attribute.split("=");
      const attrKey = attrKeyRaw?.toLowerCase();
      const attrValue = attrValueRaw?.trim();

      if (!attrKey) continue;

      if (attrKey === "httponly") {
        options.httpOnly = true;
      } else if (attrKey === "secure") {
        options.secure = true;
      } else if (attrKey === "path" && attrValue) {
        options.path = attrValue;
      } else if (attrKey === "domain" && attrValue) {
        options.domain = attrValue;
      } else if (attrKey === "samesite" && attrValue) {
        const sameSite = attrValue.toLowerCase();
        if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
          options.sameSite = sameSite;
        }
      } else if (attrKey === "max-age" && attrValue) {
        const maxAge = Number(attrValue);
        if (!Number.isNaN(maxAge)) options.maxAge = maxAge;
      } else if (attrKey === "expires" && attrValue) {
        const expires = new Date(attrValue);
        if (!Number.isNaN(expires.getTime())) options.expires = expires;
      }
    }

    cookieStore.set(name, value, options);
  }
}

function getSetCookies(response: Response): string[] {
  const headersWithSetCookie = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  if (typeof headersWithSetCookie.getSetCookie === "function") {
    return headersWithSetCookie.getSetCookie();
  }
  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

export async function backendJson(
  path: string,
  init: BackendRequestInit = {}
): Promise<BackendJsonResult> {
  const headers = new Headers(init.headers);
  headers.set("X-Contract-Version", "1");

  const cookieHeader = await buildCookieHeader();
  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body
  });

  await applySetCookies(getSetCookies(response));

  return {
    ok: response.ok,
    status: response.status,
    requestId: response.headers.get("X-Request-Id"),
    body: await response.text()
  };
}

export async function backendBinary(
  path: string,
  init: BackendRequestInit = {}
): Promise<BackendBinaryResult> {
  const headers = new Headers(init.headers);
  headers.set("X-Contract-Version", "1");

  const cookieHeader = await buildCookieHeader();
  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body
  });

  await applySetCookies(getSetCookies(response));

  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    ok: response.ok,
    status: response.status,
    requestId: response.headers.get("X-Request-Id"),
    bodyBase64: buffer.toString("base64"),
    contentDisposition: response.headers.get("Content-Disposition"),
    contentType: response.headers.get("Content-Type")
  };
}


