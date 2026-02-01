/**
 * Procedure Configuration Types
 *
 * These types define the structure for procedure configurations.
 * Each procedure (IZA, IPK, IAA) has its own config files:
 * - meta.ts: Name, Code, Target audience
 * - steps.ts: Wizard steps & required fields
 * - mapping.ts: Form field mappings
 * - hints.ts: Knowledge base explanations
 */

export type ProcedureCode = "IZA" | "IPK" | "IAA";

export type TargetAudience = "PRIVATE" | "BUSINESS" | "BOTH";

/**
 * Procedure metadata
 */
export type ProcedureMeta = {
  code: ProcedureCode;
  version: string;
  name: string;
  shortDescription: string;
  targetAudience: TargetAudience;
  isActive: boolean;
};

/**
 * Field type definition
 */
export type FieldType =
  | "TEXT"
  | "NUMBER"
  | "SELECT"
  | "COUNTRY"
  | "CURRENCY"
  | "BOOLEAN";

/**
 * Field configuration
 */
export type FieldConfig = {
  title?: string;
  label?: string;
  placeholder?: string;
  description?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  default?: string | number | boolean;
};

/**
 * Field definition within a step
 */
export type FieldDefinition = {
  fieldKey: string;
  fieldType: FieldType;
  required: boolean;
  config: FieldConfig;
  order: number;
};

/**
 * Step definition within a procedure
 */
export type StepDefinition = {
  stepKey: string;
  title: string;
  description?: string;
  order: number;
  fields: FieldDefinition[];
};

/**
 * Complete step configuration for a procedure
 */
export type ProcedureStepsConfig = {
  procedureCode: ProcedureCode;
  procedureVersion: string;
  steps: StepDefinition[];
};

/**
 * Field mapping to Zoll form
 */
export type FieldMapping = {
  fieldKey: string;
  label: string;
  targetForm: string;
  targetField: string;
  hint?: string;
};

/**
 * Complete mapping configuration for a procedure
 */
export type ProcedureMappingConfig = {
  procedureCode: ProcedureCode;
  procedureVersion: string;
  displayName: string;
  formName: string;
  mappings: FieldMapping[];
};

/**
 * Hint from knowledge base
 */
export type FieldHint = {
  fieldKey: string;
  title: string;
  summary: string;
  explanation?: string;
};

/**
 * Complete hints configuration for a procedure
 */
export type ProcedureHintsConfig = {
  procedureCode: ProcedureCode;
  procedureVersion: string;
  hints: FieldHint[];
};

/**
 * Complete procedure configuration
 */
export type ProcedureConfig = {
  meta: ProcedureMeta;
  steps: ProcedureStepsConfig;
  mapping: ProcedureMappingConfig;
  hints: ProcedureHintsConfig;
};
