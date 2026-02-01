/**
 * IAA v1 - Complete Procedure Configuration
 */

import type { ProcedureConfig } from "../../types";
import { IAA_V1_HINTS } from "./hints";
import { IAA_V1_MAPPING } from "./mapping";
import { IAA_V1_META } from "./meta";
import { IAA_V1_STEPS } from "./steps";

export const IAA_V1: ProcedureConfig = {
  meta: IAA_V1_META,
  steps: IAA_V1_STEPS,
  mapping: IAA_V1_MAPPING,
  hints: IAA_V1_HINTS,
};

export { IAA_V1_HINTS, IAA_V1_MAPPING, IAA_V1_META, IAA_V1_STEPS };
