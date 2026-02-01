/**
 * IPK v1 - Complete Procedure Configuration
 */

import type { ProcedureConfig } from "../../types";
import { IPK_V1_HINTS } from "./hints";
import { IPK_V1_MAPPING } from "./mapping";
import { IPK_V1_META } from "./meta";
import { IPK_V1_STEPS } from "./steps";

export const IPK_V1: ProcedureConfig = {
  meta: IPK_V1_META,
  steps: IPK_V1_STEPS,
  mapping: IPK_V1_MAPPING,
  hints: IPK_V1_HINTS,
};

export { IPK_V1_HINTS, IPK_V1_MAPPING, IPK_V1_META, IPK_V1_STEPS };
