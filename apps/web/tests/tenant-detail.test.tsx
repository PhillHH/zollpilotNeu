import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi } from "vitest";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}));

import { TenantDetailClient } from "../src/app/admin/tenants/[id]/TenantDetailClient";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockTenantsData = {
  data: [
    {
      id: "tenant-1",
      name: "Test Org",
      plan_code: "FREE",
      credits_balance: 100,
      created_at: "2024-01-01T00:00:00Z"
    }
  ]
};

const mockPlansData = {
  data: [
    { id: "plan-1", code: "FREE", name: "Free Plan", is_active: true, interval: "NONE", price_cents: 0, currency: "EUR", created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
    { id: "plan-2", code: "BASIC", name: "Basic Plan", is_active: true, interval: "MONTHLY", price_cents: 999, currency: "EUR", created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" }
  ]
};

const mockLedgerData = {
  data: [
    { id: "entry-1", delta: 50, reason: "ADMIN_GRANT", metadata_json: { note: "Test" }, created_by_user_id: "user-1", created_at: "2024-01-02T00:00:00Z" }
  ]
};

beforeEach(() => {
  vi.clearAllMocks();

  mockFetch.mockImplementation((url: string) => {
    if (url.includes("/admin/tenants") && url.includes("/credits/ledger")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockLedgerData),
        headers: new Headers()
      });
    }
    if (url.includes("/admin/tenants") && url.includes("/credits/grant")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { balance: 150 } }),
        headers: new Headers()
      });
    }
    if (url.includes("/admin/tenants")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTenantsData),
        headers: new Headers()
      });
    }
    if (url.includes("/admin/plans")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPlansData),
        headers: new Headers()
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
      headers: new Headers()
    });
  });
});

test("renders tenant detail with plan and credits", async () => {
  await act(async () => {
    render(<TenantDetailClient tenantId="tenant-1" />);
  });

  await waitFor(() => {
    expect(screen.getByText("Test Org")).toBeInTheDocument();
  });

  expect(screen.getByText("100")).toBeInTheDocument();
  expect(screen.getByText("FREE")).toBeInTheDocument();
});

test("grant credits button triggers POST call", async () => {
  await act(async () => {
    render(<TenantDetailClient tenantId="tenant-1" />);
  });

  await waitFor(() => {
    expect(screen.getByText("Test Org")).toBeInTheDocument();
  });

  const amountInput = screen.getByPlaceholderText("Amount");
  const grantButton = screen.getByText("Grant Credits");

  await act(async () => {
    fireEvent.change(amountInput, { target: { value: "50" } });
    fireEvent.click(grantButton);
  });

  await waitFor(() => {
    const grantCalls = mockFetch.mock.calls.filter((call) =>
      call[0].includes("/credits/grant")
    );
    expect(grantCalls.length).toBeGreaterThan(0);
  });
});

test("shows ledger entries", async () => {
  await act(async () => {
    render(<TenantDetailClient tenantId="tenant-1" />);
  });

  await waitFor(() => {
    expect(screen.getByText("ADMIN_GRANT")).toBeInTheDocument();
    expect(screen.getByText("+50")).toBeInTheDocument();
  });
});

