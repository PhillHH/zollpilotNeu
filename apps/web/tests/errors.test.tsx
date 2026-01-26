import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach } from "vitest";
import {
  getErrorMessage,
  isRetryable,
  getErrorRedirect,
  formatApiError,
  isErrorCode,
} from "../src/app/lib/errors";
import { ErrorBanner } from "../src/app/components/ErrorBanner";
import type { ApiError } from "../src/app/lib/api/client";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("Error Handling", () => {
  describe("getErrorMessage", () => {
    test("returns user-friendly message for known error codes", () => {
      expect(getErrorMessage("AUTH_REQUIRED")).toBe(
        "Bitte melden Sie sich an, um fortzufahren."
      );
      expect(getErrorMessage("INSUFFICIENT_CREDITS")).toBe(
        "Nicht genügend Credits. Bitte laden Sie Credits auf."
      );
      expect(getErrorMessage("RATE_LIMITED")).toBe(
        "Zu viele Anfragen. Bitte warten Sie einen Moment."
      );
      expect(getErrorMessage("CASE_INVALID")).toBe(
        "Der Fall enthält Fehler. Bitte korrigieren Sie diese."
      );
    });

    test("returns default message for unknown error codes", () => {
      expect(getErrorMessage("UNKNOWN_CODE_XYZ")).toBe(
        "Ein unbekannter Fehler ist aufgetreten."
      );
    });
  });

  describe("isRetryable", () => {
    test("returns true for retryable errors", () => {
      expect(isRetryable("RATE_LIMITED")).toBe(true);
      expect(isRetryable("INTERNAL_SERVER_ERROR")).toBe(true);
    });

    test("returns false for non-retryable errors", () => {
      expect(isRetryable("AUTH_REQUIRED")).toBe(false);
      expect(isRetryable("VALIDATION_ERROR")).toBe(false);
      expect(isRetryable("INSUFFICIENT_CREDITS")).toBe(false);
    });
  });

  describe("getErrorRedirect", () => {
    test("returns redirect path for auth errors", () => {
      expect(getErrorRedirect("AUTH_REQUIRED")).toBe("/login");
    });

    test("returns redirect path for billing errors", () => {
      expect(getErrorRedirect("INSUFFICIENT_CREDITS")).toBe("/app/billing");
    });

    test("returns null for errors without redirect", () => {
      expect(getErrorRedirect("VALIDATION_ERROR")).toBeNull();
      expect(getErrorRedirect("CASE_INVALID")).toBeNull();
    });
  });

  describe("formatApiError", () => {
    test("formats error with all fields", () => {
      const error: ApiError = {
        code: "INSUFFICIENT_CREDITS",
        message: "Backend message",
        status: 402,
        requestId: "req-123-456",
      };

      const formatted = formatApiError(error);

      expect(formatted.message).toBe(
        "Nicht genügend Credits. Bitte laden Sie Credits auf."
      );
      expect(formatted.supportCode).toBe("req-123-456");
      expect(formatted.canRetry).toBe(false);
      expect(formatted.redirectTo).toBe("/app/billing");
    });

    test("handles missing requestId", () => {
      const error: ApiError = {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        status: 400,
      };

      const formatted = formatApiError(error);

      expect(formatted.supportCode).toBeNull();
    });
  });

  describe("isErrorCode", () => {
    test("returns true when error matches code", () => {
      const error = { code: "AUTH_REQUIRED", status: 401 };
      expect(isErrorCode(error, "AUTH_REQUIRED")).toBe(true);
    });

    test("returns false when error does not match code", () => {
      const error = { code: "AUTH_REQUIRED", status: 401 };
      expect(isErrorCode(error, "FORBIDDEN")).toBe(false);
    });

    test("returns false for non-object errors", () => {
      expect(isErrorCode("some string", "AUTH_REQUIRED")).toBe(false);
      expect(isErrorCode(null, "AUTH_REQUIRED")).toBe(false);
    });
  });
});

describe("ErrorBanner Component", () => {
  test("renders nothing when error is null", () => {
    const { container } = render(<ErrorBanner error={null} />);
    expect(container.firstChild).toBeNull();
  });

  test("renders error message", () => {
    const error: ApiError = {
      code: "VALIDATION_ERROR",
      message: "Backend message",
      status: 400,
    };

    render(<ErrorBanner error={error} />);

    expect(
      screen.getByText("Die eingegebenen Daten sind ungültig.")
    ).toBeInTheDocument();
  });

  test("renders support code when present", () => {
    const error: ApiError = {
      code: "INTERNAL_SERVER_ERROR",
      message: "Error",
      status: 500,
      requestId: "abc-123-xyz",
    };

    render(<ErrorBanner error={error} />);

    expect(screen.getByText("Support-Code:")).toBeInTheDocument();
    expect(screen.getByText("abc-123-xyz")).toBeInTheDocument();
  });

  test("shows retry button for retryable errors", () => {
    const error: ApiError = {
      code: "RATE_LIMITED",
      message: "Too many requests",
      status: 429,
    };
    const onRetry = vi.fn();

    render(<ErrorBanner error={error} onRetry={onRetry} />);

    const retryButton = screen.getByText("Erneut versuchen");
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("does not show retry button for non-retryable errors", () => {
    const error: ApiError = {
      code: "VALIDATION_ERROR",
      message: "Invalid",
      status: 400,
    };
    const onRetry = vi.fn();

    render(<ErrorBanner error={error} onRetry={onRetry} />);

    expect(screen.queryByText("Erneut versuchen")).not.toBeInTheDocument();
  });

  test("shows billing CTA for INSUFFICIENT_CREDITS", () => {
    const error: ApiError = {
      code: "INSUFFICIENT_CREDITS",
      message: "No credits",
      status: 402,
    };

    render(<ErrorBanner error={error} />);

    const billingLink = screen.getByText("Credits kaufen");
    expect(billingLink).toBeInTheDocument();
    expect(billingLink).toHaveAttribute("href", "/app/billing");
  });

  test("shows login CTA for AUTH_REQUIRED", () => {
    const error: ApiError = {
      code: "AUTH_REQUIRED",
      message: "Auth required",
      status: 401,
    };

    render(<ErrorBanner error={error} />);

    const loginLink = screen.getByText("Anmelden");
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  test("dismiss button calls onDismiss", () => {
    const error: ApiError = {
      code: "VALIDATION_ERROR",
      message: "Error",
      status: 400,
    };
    const onDismiss = vi.fn();

    render(<ErrorBanner error={error} onDismiss={onDismiss} />);

    const dismissButton = screen.getByLabelText("Schließen");
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

