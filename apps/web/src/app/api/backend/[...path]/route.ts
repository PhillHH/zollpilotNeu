import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  "http://localhost:8000";

type RouteContext = {
  params: { path: string[] };
};

/**
 * Headers that should not be forwarded from the upstream response.
 * - transfer-encoding: Handled by the runtime
 * - content-encoding: Body is already decoded by fetch()
 * - content-length: Will be recalculated for the new response
 */
const SKIP_RESPONSE_HEADERS = new Set([
  "transfer-encoding",
  "content-encoding",
  "content-length",
]);

async function proxy(request: Request, { params }: RouteContext): Promise<Response> {
  const targetPath = params.path.join("/");
  const url = new URL(request.url);
  const upstreamUrl = `${API_BASE_URL}/${targetPath}${url.search}`;

  const headers = new Headers(request.headers);
  if (!headers.has("X-Contract-Version")) {
    headers.set("X-Contract-Version", "1");
  }

  // Remove headers that shouldn't be forwarded to upstream
  headers.delete("content-length");
  headers.delete("host");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
  });

  // Get response body
  const responseBody = await upstreamResponse.arrayBuffer();

  // Create NextResponse
  const response = new NextResponse(responseBody, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });

  // Copy headers from upstream response (except special ones)
  // IMPORTANT: Headers.forEach() does NOT properly iterate Set-Cookie headers!
  // It either skips them entirely or combines multiple cookies incorrectly.
  upstreamResponse.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (!SKIP_RESPONSE_HEADERS.has(lowerKey) && lowerKey !== "set-cookie") {
      response.headers.set(key, value);
    }
  });

  // Handle Set-Cookie headers explicitly using getSetCookie()
  // This is the ONLY reliable way to forward cookies in Node.js 18+
  // because Set-Cookie is a "forbidden response-header name" that gets
  // special treatment in the Fetch API.
  const setCookieHeaders = upstreamResponse.headers.getSetCookie();
  if (setCookieHeaders && setCookieHeaders.length > 0) {
    for (const cookie of setCookieHeaders) {
      // Use append() not set() - each Set-Cookie must be a separate header
      response.headers.append("Set-Cookie", cookie);
    }
  }

  return response;
}

export async function GET(request: Request, context: RouteContext) {
  return proxy(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxy(request, context);
}

export async function PUT(request: Request, context: RouteContext) {
  return proxy(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return proxy(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return proxy(request, context);
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
