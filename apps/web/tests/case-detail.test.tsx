import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi } from "vitest";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

import { CaseDetailClient } from "../src/app/app/cases/[id]/CaseDetailClient";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockCaseData = {
  data: {
    id: "test-case-id",
    title: "Test Case Title",
    status: "DRAFT",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-02T12:00:00Z",
    archived_at: null,
    fields: [{ key: "notes", value: "Existing notes", updated_at: "2024-01-02T12:00:00Z" }]
  }
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();

  mockFetch.mockImplementation((url: string) => {
    if (url.includes("/cases/test-case-id") && !url.includes("/fields")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCaseData),
        headers: new Headers({ "X-Request-Id": "test-req-id" })
      });
    }
    if (url.includes("/fields/notes")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { key: "notes", value: "Updated", updated_at: new Date().toISOString() }
          }),
        headers: new Headers({ "X-Request-Id": "test-req-id" })
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
      headers: new Headers()
    });
  });
});

afterEach(() => {
  vi.useRealTimers();
});

test("renders case detail with title and status", async () => {
  await act(async () => {
    render(<CaseDetailClient caseId="test-case-id" />);
  });

  await waitFor(() => {
    expect(screen.getByText("Test Case Title")).toBeInTheDocument();
  });

  expect(screen.getByText("DRAFT")).toBeInTheDocument();
});

test("renders existing notes from fields", async () => {
  await act(async () => {
    render(<CaseDetailClient caseId="test-case-id" />);
  });

  await waitFor(() => {
    const textarea = screen.getByPlaceholderText("Add notes here...");
    expect(textarea).toHaveValue("Existing notes");
  });
});

test("notes textarea triggers debounced save", async () => {
  await act(async () => {
    render(<CaseDetailClient caseId="test-case-id" />);
  });

  await waitFor(() => {
    expect(screen.getByText("Test Case Title")).toBeInTheDocument();
  });

  const textarea = screen.getByPlaceholderText("Add notes here...");

  // Type in textarea
  await act(async () => {
    fireEvent.change(textarea, { target: { value: "New notes content" } });
  });

  // Verify save hasn't been called yet (debounced)
  const saveCallsBefore = mockFetch.mock.calls.filter((call) =>
    call[0].includes("/fields/notes")
  );
  expect(saveCallsBefore.length).toBe(0);

  // Fast-forward debounce timer (800ms)
  await act(async () => {
    vi.advanceTimersByTime(800);
  });

  // Now save should have been called
  await waitFor(() => {
    const saveCalls = mockFetch.mock.calls.filter((call) =>
      call[0].includes("/fields/notes")
    );
    expect(saveCalls.length).toBeGreaterThan(0);
  });
});

test("shows archive button for non-archived cases", async () => {
  await act(async () => {
    render(<CaseDetailClient caseId="test-case-id" />);
  });

  await waitFor(() => {
    expect(screen.getByText("Archive Case")).toBeInTheDocument();
  });
});

