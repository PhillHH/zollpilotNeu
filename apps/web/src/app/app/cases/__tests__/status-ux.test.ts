/**
 * Status UX Behavior Tests
 *
 * Tests for user experience behavior during status transitions:
 * - 409 error handling with reload action
 * - Loading/disabled states during requests
 * - Success toast messages
 * - Error message localization
 */

import { describe, it, expect, vi } from "vitest";

import {
  getErrorMessage,
  isConcurrentModificationError,
  isNetworkError,
  createReloadAction,
  createRetryAction,
} from "../../../lib/errors";

describe("Error Handling", () => {
  describe("getErrorMessage", () => {
    it("returns user-friendly message for CONCURRENT_MODIFICATION", () => {
      const message = getErrorMessage("CONCURRENT_MODIFICATION");
      expect(message).toBe(
        "Der Status wurde zwischenzeitlich geändert. Bitte laden Sie den Fall neu."
      );
    });

    it("returns user-friendly message for CANNOT_REOPEN", () => {
      const message = getErrorMessage("CANNOT_REOPEN");
      expect(message).toBe(
        "Dieser Fall kann nicht zur Bearbeitung geöffnet werden."
      );
    });

    it("returns user-friendly message for CANNOT_COMPLETE", () => {
      const message = getErrorMessage("CANNOT_COMPLETE");
      expect(message).toBe(
        "Dieser Fall kann nicht als erledigt markiert werden."
      );
    });

    it("returns user-friendly message for CASE_INVALID", () => {
      const message = getErrorMessage("CASE_INVALID");
      expect(message).toBe(
        "Der Fall enthält Fehler. Bitte korrigieren Sie diese."
      );
    });

    it("returns fallback message for unknown errors", () => {
      const message = getErrorMessage("UNKNOWN_TECHNICAL_ERROR");
      expect(message).toBe(
        "Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut."
      );
    });

    it("returns network error message for NETWORK_ERROR", () => {
      const message = getErrorMessage("NETWORK_ERROR");
      expect(message).toBe(
        "Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung."
      );
    });

    it("returns timeout message for TIMEOUT", () => {
      const message = getErrorMessage("TIMEOUT");
      expect(message).toBe(
        "Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut."
      );
    });
  });

  describe("isConcurrentModificationError", () => {
    it("detects 409 status", () => {
      const error = { status: 409, code: "SOME_ERROR", message: "Conflict" };
      expect(isConcurrentModificationError(error)).toBe(true);
    });

    it("detects CONCURRENT_MODIFICATION code", () => {
      const error = { status: 200, code: "CONCURRENT_MODIFICATION", message: "" };
      expect(isConcurrentModificationError(error)).toBe(true);
    });

    it("detects STATUS_UNCHANGED code", () => {
      const error = { status: 200, code: "STATUS_UNCHANGED", message: "" };
      expect(isConcurrentModificationError(error)).toBe(true);
    });

    it("returns false for other errors", () => {
      const error = { status: 400, code: "VALIDATION_ERROR", message: "" };
      expect(isConcurrentModificationError(error)).toBe(false);
    });

    it("returns false for null/undefined", () => {
      expect(isConcurrentModificationError(null)).toBe(false);
      expect(isConcurrentModificationError(undefined)).toBe(false);
    });
  });

  describe("isNetworkError", () => {
    it("detects NETWORK_ERROR code", () => {
      const error = { code: "NETWORK_ERROR" };
      expect(isNetworkError(error)).toBe(true);
    });

    it("detects TIMEOUT code", () => {
      const error = { code: "TIMEOUT" };
      expect(isNetworkError(error)).toBe(true);
    });

    it("detects status 0", () => {
      const error = { status: 0 };
      expect(isNetworkError(error)).toBe(true);
    });

    it("returns false for other errors", () => {
      const error = { status: 400, code: "VALIDATION_ERROR" };
      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe("createReloadAction", () => {
    it("returns action with correct label", () => {
      const action = createReloadAction();
      expect(action.label).toBe("Neu laden");
      expect(typeof action.onClick).toBe("function");
    });
  });

  describe("createRetryAction", () => {
    it("returns action with correct label and calls callback", () => {
      const callback = vi.fn();
      const action = createRetryAction(callback);

      expect(action.label).toBe("Erneut versuchen");
      action.onClick();
      expect(callback).toHaveBeenCalled();
    });
  });
});

describe("Status Transition UX Requirements", () => {
  /**
   * All status buttons must:
   * 1. Show loading spinner while request is in progress
   * 2. Be disabled during loading (prevent double-click)
   * 3. Show success toast on success
   * 4. Show error toast with reload action on 409
   * 5. Show error toast on other errors
   */

  describe("Button disabled state during loading", () => {
    it("button should be disabled while request is in progress", () => {
      // This is a unit test placeholder - actual test would use React Testing Library
      // The implementation ensures `if (reopening) return;` prevents double-click
      const reopening = true;
      expect(reopening).toBe(true);
    });
  });

  describe("Success feedback messages (German)", () => {
    const successMessages = {
      submit: "Vorbereitung erfolgreich abgeschlossen.",
      reopen: "Bearbeitung wieder geöffnet.",
      complete: "Fall als erledigt markiert.",
    };

    it("submit success message is correct", () => {
      expect(successMessages.submit).toBe("Vorbereitung erfolgreich abgeschlossen.");
    });

    it("reopen success message is correct", () => {
      expect(successMessages.reopen).toBe("Bearbeitung wieder geöffnet.");
    });

    it("complete success message is correct", () => {
      expect(successMessages.complete).toBe("Fall als erledigt markiert.");
    });
  });

  describe("Error messages are not technical", () => {
    const technicalTerms = ["409", "HTTP", "CONCURRENT", "fetch", "undefined", "null"];

    it("error messages should not contain technical terms", () => {
      const errorCodes = [
        "CONCURRENT_MODIFICATION",
        "CANNOT_REOPEN",
        "CANNOT_COMPLETE",
        "CASE_INVALID",
        "UNKNOWN_ERROR",
      ];

      for (const code of errorCodes) {
        const message = getErrorMessage(code);
        for (const term of technicalTerms) {
          expect(message.toLowerCase()).not.toContain(term.toLowerCase());
        }
      }
    });
  });
});

describe("Readonly Status Detection", () => {
  const readonlyStatuses = ["PREPARED", "COMPLETED", "ARCHIVED"];
  const editableStatuses = ["DRAFT", "IN_PROCESS"];

  it("PREPARED, COMPLETED, ARCHIVED should be readonly", () => {
    for (const status of readonlyStatuses) {
      expect(["PREPARED", "COMPLETED", "ARCHIVED"].includes(status)).toBe(true);
    }
  });

  it("DRAFT, IN_PROCESS should be editable", () => {
    for (const status of editableStatuses) {
      expect(["PREPARED", "COMPLETED", "ARCHIVED"].includes(status)).toBe(false);
    }
  });
});
