/**
 * IZA v1 - Complete Procedure Configuration
 */

import type { ProcedureConfig } from "../../types";
import { IZA_V1_HINTS } from "./hints";
import { IZA_V1_MAPPING } from "./mapping";
import { IZA_V1_META } from "./meta";
import { IZA_V1_STEPS } from "./steps";

export const IZA_V1: ProcedureConfig = {
  meta: IZA_V1_META,
  steps: IZA_V1_STEPS,
  mapping: IZA_V1_MAPPING,
  hints: IZA_V1_HINTS,
};

export { IZA_V1_HINTS, IZA_V1_MAPPING, IZA_V1_META, IZA_V1_STEPS };
