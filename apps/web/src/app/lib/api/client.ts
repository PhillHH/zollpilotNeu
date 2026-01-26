export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string | null;
  status: number;
};

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const baseUrl =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8000";

  const headers = new Headers(init.headers);
  headers.set("X-Contract-Version", "1");

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers
  });

  const requestId = response.headers.get("X-Request-Id");

  if (!response.ok) {
    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    const error = payload?.error ?? {};
    throw {
      code: error.code ?? "UNKNOWN_ERROR",
      message: error.message ?? "Request failed.",
      details: error.details,
      requestId: payload?.requestId ?? requestId,
      status: response.status
    } satisfies ApiError;
  }

  return (await response.json()) as T;
}

