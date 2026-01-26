import { vi } from "vitest";

import { apiRequest } from "../app/lib/api/client";

test("api client sets contract version header", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: { ok: true } }),
    headers: new Headers()
  });
  globalThis.fetch = fetchMock;

  await apiRequest("/health");

  const [, options] = fetchMock.mock.calls[0];
  const headers = new Headers(options?.headers);
  expect(headers.get("X-Contract-Version")).toBe("1");
});

