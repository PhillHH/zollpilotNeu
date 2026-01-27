import { vi, describe, test, expect } from "vitest";

// Mock next/headers to avoid "cookies was called outside a request scope" error
const mockCookieStore = {
  getAll: vi.fn().mockReturnValue([]),
  get: vi.fn(),
  set: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: () => mockCookieStore,
}));

describe("API Client", () => {
  test("api client sets contract version header", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: async () => '{"data":{"ok":true}}',
      json: async () => ({ data: { ok: true } }),
    });
    globalThis.fetch = fetchMock;

    // Reset modules to pick up mocked cookies
    vi.resetModules();
    const { apiRequest } = await import("../src/app/lib/api/client");

    await apiRequest("/health");

    const [, options] = fetchMock.mock.calls[0];
    const headers = new Headers(options?.headers);
    expect(headers.get("X-Contract-Version")).toBe("1");
  });
});



