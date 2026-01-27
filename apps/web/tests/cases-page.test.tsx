import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { CasesClient } from "../src/app/app/cases/CasesClient";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}));

// Mock fetch for useEffect calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: [] }),
    headers: new Headers()
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

test("renders cases list with title and status", () => {
  render(
    <CasesClient
      initialCases={[
        {
          id: "1",
          title: "Case A",
          status: "DRAFT",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z"
        },
        {
          id: "2",
          title: "Case B",
          status: "SUBMITTED",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z"
        }
      ]}
    />
  );

  expect(screen.getByText("Case A")).toBeInTheDocument();
  expect(screen.getByText("Case B")).toBeInTheDocument();
  expect(screen.getByText("DRAFT")).toBeInTheDocument();
  expect(screen.getByText("SUBMITTED")).toBeInTheDocument();
});

test("renders filter buttons", () => {
  render(<CasesClient initialCases={[]} />);

  expect(screen.getByText("Active")).toBeInTheDocument();
  expect(screen.getByText("Archived")).toBeInTheDocument();
});

test("renders create case button", () => {
  render(<CasesClient initialCases={[]} />);

  expect(screen.getByText("+ Create Case")).toBeInTheDocument();
});



