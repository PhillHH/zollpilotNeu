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
  | "NO_SNAPSHOT"
  | "INSUFFICIENT_CREDITS"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "INTERNAL_SERVER_ERROR"
  | "UNKNOWN_ERROR";

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
  NO_SNAPSHOT: "Kein Snapshot vorhanden. Bitte reichen Sie den Fall zuerst ein.",
  INSUFFICIENT_CREDITS: "Nicht genügend Credits. Bitte laden Sie Credits auf.",
  PAYLOAD_TOO_LARGE: "Die Daten sind zu groß. Bitte reduzieren Sie die Eingabe.",
  RATE_LIMITED: "Zu viele Anfragen. Bitte warten Sie einen Moment.",
  INTERNAL_SERVER_ERROR: "Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
  UNKNOWN_ERROR: "Ein unbekannter Fehler ist aufgetreten.",
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

