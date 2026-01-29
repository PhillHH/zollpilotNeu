import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  "http://localhost:8000";

type RouteContext = {
  params: { path: string[] };
};

async function proxy(request: Request, { params }: RouteContext): Promise<Response> {
  const targetPath = params.path.join("/");
  const url = new URL(request.url);
  const upstreamUrl = `${API_BASE_URL}/${targetPath}${url.search}`;

  const headers = new Headers(request.headers);
  if (!headers.has("X-Contract-Version")) {
    headers.set("X-Contract-Version", "1");
  }

  // Remove headers that shouldn't be forwarded
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

  // Create NextResponse which properly handles Set-Cookie
  const response = new NextResponse(responseBody, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });

  // Copy all headers from upstream response
  upstreamResponse.headers.forEach((value, key) => {
    // Skip headers that NextResponse handles specially
    if (key.toLowerCase() !== "transfer-encoding") {
      response.headers.set(key, value);
    }
  });

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
