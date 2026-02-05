/**
 * Error Handling Utilities für das Frontend.
 *
 * Zentrales Mapping von API Error Codes zu benutzerfreundlichen Nachrichten.
 */

import type { ApiError } from "./api/client";

/**
 * Alle bekannten Error Codes aus dem Backend.
 */
export type ErrorCode =
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "EMAIL_IN_USE"
  | "INVALID_CREDENTIALS"
  | "NOT_FOUND"
  | "CASE_NOT_FOUND"
  | "PROCEDURE_NOT_FOUND"
  | "SNAPSHOT_NOT_FOUND"
  | "PLAN_NOT_FOUND"
  | "TENANT_NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONTRACT_VERSION_INVALID"
  | "NO_PROCEDURE_BOUND"
  | "CASE_INVALID"
  | "CASE_NOT_EDITABLE"
  | "CASE_NOT_SUBMITTED"
  | "CASE_ARCHIVED"
  | "CASE_COMPLETED"
  | "CASE_NOT_IN_PROCESS"
  | "NO_SNAPSHOT"
  | "INSUFFICIENT_CREDITS"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "INTERNAL_SERVER_ERROR"
  | "UNKNOWN_ERROR"
  // New status-related errors
  | "CONCURRENT_MODIFICATION"
  | "STATUS_UNCHANGED"
  | "INVALID_STATUS"
  | "STATUS_ROLLBACK_NOT_ALLOWED"
  | "STATUS_SKIP_NOT_ALLOWED"
  | "CANNOT_REOPEN"
  | "CANNOT_COMPLETE"
  | "WIZARD_NOT_COMPLETED"
  | "WIZARD_NOT_INITIALIZED"
  | "NO_TENANT"
  | "NO_USER"
  | "NETWORK_ERROR"
  | "TIMEOUT";

/**
 * Benutzerfreundliche Fehlermeldungen für jeden Error Code.
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  AUTH_REQUIRED: "Bitte melden Sie sich an, um fortzufahren.",
  FORBIDDEN: "Sie haben keine Berechtigung für diese Aktion.",
  EMAIL_IN_USE: "Diese E-Mail-Adresse ist bereits registriert.",
  INVALID_CREDENTIALS: "E-Mail oder Passwort ist falsch.",
  NOT_FOUND: "Die angeforderte Ressource wurde nicht gefunden.",
  CASE_NOT_FOUND: "Der angeforderte Fall wurde nicht gefunden.",
  PROCEDURE_NOT_FOUND: "Das Verfahren wurde nicht gefunden.",
  SNAPSHOT_NOT_FOUND: "Der Snapshot wurde nicht gefunden.",
  PLAN_NOT_FOUND: "Der Plan wurde nicht gefunden.",
  TENANT_NOT_FOUND: "Der Mandant wurde nicht gefunden.",
  VALIDATION_ERROR: "Die eingegebenen Daten sind ungültig.",
  CONTRACT_VERSION_INVALID: "API-Versionsfehler. Bitte laden Sie die Seite neu.",
  NO_PROCEDURE_BOUND: "Bitte wählen Sie zuerst ein Verfahren aus.",
  CASE_INVALID: "Der Fall enthält Fehler. Bitte korrigieren Sie diese.",
  CASE_NOT_EDITABLE: "Dieser Fall kann nicht mehr bearbeitet werden.",
  CASE_NOT_SUBMITTED: "Der Fall muss zuerst eingereicht werden.",
  CASE_ARCHIVED: "Archivierte Fälle können nicht geändert werden.",
  CASE_COMPLETED: "Dieser Fall ist abgeschlossen und kann nicht mehr bearbeitet werden.",
  CASE_NOT_IN_PROCESS: "Der Fall befindet sich nicht in Bearbeitung.",
  NO_SNAPSHOT: "Kein Snapshot vorhanden. Bitte reichen Sie den Fall zuerst ein.",
  INSUFFICIENT_CREDITS: "Nicht genügend Credits. Bitte laden Sie Credits auf.",
  PAYLOAD_TOO_LARGE: "Die Daten sind zu groß. Bitte reduzieren Sie die Eingabe.",
  RATE_LIMITED: "Zu viele Anfragen. Bitte warten Sie einen Moment.",
  INTERNAL_SERVER_ERROR: "Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
  UNKNOWN_ERROR: "Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.",
  // Status transition errors
  CONCURRENT_MODIFICATION: "Der Status wurde zwischenzeitlich geändert. Bitte laden Sie den Fall neu.",
  STATUS_UNCHANGED: "Der Status wurde bereits geändert.",
  INVALID_STATUS: "Ungültiger Status.",
  STATUS_ROLLBACK_NOT_ALLOWED: "Diese Statusänderung ist nicht erlaubt.",
  STATUS_SKIP_NOT_ALLOWED: "Statusschritte können nicht übersprungen werden.",
  CANNOT_REOPEN: "Dieser Fall kann nicht zur Bearbeitung geöffnet werden.",
  CANNOT_COMPLETE: "Dieser Fall kann nicht als erledigt markiert werden.",
  WIZARD_NOT_COMPLETED: "Bitte füllen Sie zuerst alle Schritte des Assistenten aus.",
  WIZARD_NOT_INITIALIZED: "Der Assistent wurde noch nicht gestartet.",
  NO_TENANT: "Keine Berechtigung. Bitte melden Sie sich erneut an.",
  NO_USER: "Benutzer nicht gefunden. Bitte melden Sie sich erneut an.",
  NETWORK_ERROR: "Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.",
  TIMEOUT: "Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.",
};

/**
 * Error Codes, bei denen ein Retry sinnvoll ist.
 */
const RETRYABLE_ERRORS: Set<ErrorCode> = new Set([
  "RATE_LIMITED",
  "INTERNAL_SERVER_ERROR",
]);

/**
 * Error Codes, die eine Weiterleitung erfordern.
 */
const REDIRECT_ERRORS: Partial<Record<ErrorCode, string>> = {
  AUTH_REQUIRED: "/login",
  INSUFFICIENT_CREDITS: "/app/billing",
};

/**
 * Mappt einen Error Code zu einer benutzerfreundlichen Nachricht.
 */
export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code as ErrorCode] || ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Prüft ob ein Fehler retriebar ist.
 */
export function isRetryable(code: string): boolean {
  return RETRYABLE_ERRORS.has(code as ErrorCode);
}

/**
 * Gibt einen Redirect-Pfad zurück falls der Error eine Weiterleitung erfordert.
 */
export function getErrorRedirect(code: string): string | null {
  return REDIRECT_ERRORS[code as ErrorCode] || null;
}

/**
 * Formatiert einen API-Error für die Anzeige.
 */
export function formatApiError(error: ApiError): {
  message: string;
  supportCode: string | null;
  canRetry: boolean;
  redirectTo: string | null;
} {
  const message = getErrorMessage(error.code);
  const supportCode = error.requestId || null;
  const canRetry = isRetryable(error.code);
  const redirectTo = getErrorRedirect(error.code);

  return {
    message,
    supportCode,
    canRetry,
    redirectTo,
  };
}

/**
 * Prüft ob ein Fehler ein bestimmter Error Code ist.
 */
export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  if (typeof error === "object" && error !== null && "code" in error) {
    return (error as { code: string }).code === code;
  }
  return false;
}

/**
 * Prüft ob ein Fehler ein Concurrent Modification Error ist (409).
 */
export function isConcurrentModificationError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const apiError = error as ApiError;

  return (
    apiError.status === 409 ||
    apiError.code === "CONCURRENT_MODIFICATION" ||
    apiError.code === "STATUS_UNCHANGED"
  );
}

/**
 * Prüft ob ein Fehler ein Netzwerkfehler ist.
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true;
  }

  if (typeof error === "object") {
    const apiError = error as ApiError;
    return (
      apiError.code === "NETWORK_ERROR" ||
      apiError.code === "TIMEOUT" ||
      apiError.status === 0
    );
  }

  return false;
}

/**
 * Erstellt eine Reload-Action für Toast-Benachrichtigungen.
 */
export function createReloadAction() {
  return {
    label: "Neu laden",
    onClick: () => window.location.reload(),
  };
}

/**
 * Erstellt eine Retry-Action für Toast-Benachrichtigungen.
 */
export function createRetryAction(callback: () => void) {
  return {
    label: "Erneut versuchen",
    onClick: callback,
  };
}

