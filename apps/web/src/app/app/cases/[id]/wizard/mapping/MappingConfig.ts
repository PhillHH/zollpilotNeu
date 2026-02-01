/**
 * Mapping-Konfiguration für Zollformulare
 *
 * Diese Datei re-exportiert die Mapping-Konfigurationen aus dem
 * zentralen Procedure Registry für Rückwärtskompatibilität.
 *
 * @see apps/web/src/procedures/ für die vollständigen Procedure-Konfigurationen
 */

// Re-export from procedure registry
export {
  getFieldMapping,
  getMappingConfig,
  IZA_V1,
  IPK_V1,
  IAA_V1,
} from "@/procedures";

// Re-export types
export type { FieldMapping, ProcedureMappingConfig } from "@/procedures";

// Legacy exports for backward compatibility
import { IZA_V1, IPK_V1, IAA_V1, type ProcedureMappingConfig } from "@/procedures";

/**
 * Alle verfügbaren Mapping-Konfigurationen
 * @deprecated Use getProcedureMapping from @/procedures instead
 */
export const MAPPING_CONFIGS: Record<string, ProcedureMappingConfig> = {
  "IZA:v1": IZA_V1.mapping,
  "IPK:v1": IPK_V1.mapping,
  "IAA:v1": IAA_V1.mapping,
};

/**
 * IZA v1 Mapping (legacy export)
 * @deprecated Use IZA_V1.mapping from @/procedures instead
 */
export const IZA_V1_MAPPING = IZA_V1.mapping;
