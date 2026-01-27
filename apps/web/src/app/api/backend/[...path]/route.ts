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

  // Let fetch compute correct Content-Length.
  headers.delete("content-length");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  const rawSetCookie = upstreamResponse.headers.get("set-cookie");
  const setCookies =
    typeof upstreamResponse.headers.getSetCookie === "function"
      ? upstreamResponse.headers.getSetCookie()
      : rawSetCookie
        ? [rawSetCookie]
        : [];
  if (setCookies.length > 0) {
    responseHeaders.delete("set-cookie");
    for (const cookie of setCookies) {
      responseHeaders.append("set-cookie", cookie);
    }
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
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


