import { vi } from "vitest";

import { requireSession } from "../src/app/lib/auth";

const redirectMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path)
}));

test("redirects when session is missing", () => {
  redirectMock.mockClear();
  requireSession(null);
  expect(redirectMock).toHaveBeenCalledWith("/login");
});

