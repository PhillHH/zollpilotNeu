import { render, screen, waitFor, act } from "@testing-library/react";
import { vi } from "vitest";

import { BillingClient } from "../src/app/app/billing/BillingClient";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockBillingData = {
  data: {
    tenant: { id: "tenant-1", name: "Test Org" },
    plan: { code: "BASIC", name: "Basic Plan", interval: "MONTHLY", price_cents: 999, currency: "EUR" },
    credits: { balance: 50 }
  }
};

beforeEach(() => {
  vi.clearAllMocks();

  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockBillingData),
    headers: new Headers({ "X-Request-Id": "test-req-id" })
  });
});

test("renders billing page with plan and balance from API", async () => {
  await act(async () => {
    render(<BillingClient />);
  });

  await waitFor(() => {
    expect(screen.getByText("Test Org")).toBeInTheDocument();
  });

  expect(screen.getByText("BASIC")).toBeInTheDocument();
  expect(screen.getByText("Basic Plan")).toBeInTheDocument();
  expect(screen.getByText("50")).toBeInTheDocument();
});

test("renders credits balance", async () => {
  await act(async () => {
    render(<BillingClient />);
  });

  await waitFor(() => {
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("Available Credits")).toBeInTheDocument();
  });
});

test("shows coming soon button for credits purchase", async () => {
  await act(async () => {
    render(<BillingClient />);
  });

  await waitFor(() => {
    const button = screen.getByText("Purchase Credits (Coming Soon)");
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });
});

test("renders when plan is null", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      data: {
        tenant: { id: "tenant-1", name: "Test Org" },
        plan: null,
        credits: { balance: 0 }
      }
    }),
    headers: new Headers()
  });

  await act(async () => {
    render(<BillingClient />);
  });

  await waitFor(() => {
    expect(screen.getByText("Test Org")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});

test("displays zero credits correctly", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      data: {
        tenant: { id: "tenant-1", name: "Test Org" },
        plan: { code: "FREE", name: "Free Plan", interval: "NONE" },
        credits: { balance: 0 }
      }
    }),
    headers: new Headers()
  });

  await act(async () => {
    render(<BillingClient />);
  });

  await waitFor(() => {
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});

test("displays high credit balance correctly", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      data: {
        tenant: { id: "tenant-1", name: "Test Org" },
        plan: { code: "PREMIUM", name: "Premium Plan", interval: "YEARLY" },
        credits: { balance: 9999 }
      }
    }),
    headers: new Headers()
  });

  await act(async () => {
    render(<BillingClient />);
  });

  await waitFor(() => {
    expect(screen.getByText("9999")).toBeInTheDocument();
    expect(screen.getByText("PREMIUM")).toBeInTheDocument();
  });
});

test("handles API error gracefully", async () => {
  mockFetch.mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({
      error: { code: "AUTH_REQUIRED", message: "Not authenticated" }
    }),
    headers: new Headers()
  });

  await act(async () => {
    render(<BillingClient />);
  });

  // Component should handle error without crashing
  await waitFor(() => {
    // Loading state should be gone
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
});

