/**
 * Procedure Registry
 *
 * Central registry for all procedure configurations.
 * Provides type-safe access to procedure definitions.
 */

import type {
  FieldHint,
  FieldMapping,
  ProcedureCode,
  ProcedureConfig,
  ProcedureHintsConfig,
  ProcedureMappingConfig,
  ProcedureMeta,
  ProcedureStepsConfig,
} from "./types";

// Import all procedure configurations
import { IAA_V1 } from "./IAA/v1";
import { IPK_V1 } from "./IPK/v1";
import { IZA_V1 } from "./IZA/v1";

/**
 * Procedure Registry - All available procedures
 */
export const PROCEDURE_REGISTRY: Record<string, ProcedureConfig> = {
  "IZA:v1": IZA_V1,
  "IPK:v1": IPK_V1,
  "IAA:v1": IAA_V1,
};

/**
 * Get all available procedure metadata
 */
export function getAllProcedures(): ProcedureMeta[] {
  return Object.values(PROCEDURE_REGISTRY)
    .filter((config) => config.meta.isActive)
    .map((config) => config.meta);
}

/**
 * Get procedure configuration by code and version
 */
export function getProcedureConfig(
  code: ProcedureCode,
  version: string
): ProcedureConfig | null {
  const key = `${code}:${version}`;
  return PROCEDURE_REGISTRY[key] ?? null;
}

/**
 * Get procedure metadata by code and version
 */
export function getProcedureMeta(
  code: ProcedureCode,
  version: string
): ProcedureMeta | null {
  const config = getProcedureConfig(code, version);
  return config?.meta ?? null;
}

/**
 * Get procedure steps configuration by code and version
 */
export function getProcedureSteps(
  code: ProcedureCode,
  version: string
): ProcedureStepsConfig | null {
  const config = getProcedureConfig(code, version);
  return config?.steps ?? null;
}

/**
 * Get procedure mapping configuration by code and version
 */
export function getProcedureMapping(
  code: ProcedureCode,
  version: string
): ProcedureMappingConfig | null {
  const config = getProcedureConfig(code, version);
  return config?.mapping ?? null;
}

/**
 * Get procedure hints configuration by code and version
 */
export function getProcedureHints(
  code: ProcedureCode,
  version: string
): ProcedureHintsConfig | null {
  const config = getProcedureConfig(code, version);
  return config?.hints ?? null;
}

/**
 * Get field mapping for a specific field
 */
export function getFieldMapping(
  code: ProcedureCode,
  version: string,
  fieldKey: string
): FieldMapping | null {
  const mapping = getProcedureMapping(code, version);
  if (!mapping) return null;
  return mapping.mappings.find((m) => m.fieldKey === fieldKey) ?? null;
}

/**
 * Get field hint for a specific field
 */
export function getFieldHint(
  code: ProcedureCode,
  version: string,
  fieldKey: string
): FieldHint | null {
  const hints = getProcedureHints(code, version);
  if (!hints) return null;
  return hints.hints.find((h) => h.fieldKey === fieldKey) ?? null;
}

/**
 * Legacy compatibility: Get mapping config in old format
 * @deprecated Use getProcedureMapping instead
 */
export function getMappingConfig(
  procedureCode: string,
  procedureVersion: string
): ProcedureMappingConfig | null {
  const key = `${procedureCode}:${procedureVersion}`;
  const config = PROCEDURE_REGISTRY[key];
  return config?.mapping ?? null;
}

// Re-export types
export type {
  FieldConfig,
  FieldDefinition,
  FieldHint,
  FieldMapping,
  FieldType,
  ProcedureCode,
  ProcedureConfig,
  ProcedureHintsConfig,
  ProcedureMappingConfig,
  ProcedureMeta,
  ProcedureStepsConfig,
  StepDefinition,
  TargetAudience,
} from "./types";

// Re-export individual procedure configs
export { IAA_V1 } from "./IAA/v1";
export { IPK_V1 } from "./IPK/v1";
export { IZA_V1 } from "./IZA/v1";
