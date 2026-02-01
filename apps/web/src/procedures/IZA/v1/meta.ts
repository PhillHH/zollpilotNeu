/**
 * IZA v1 - Internetbestellung Import Zollanmeldung
 *
 * Procedure metadata for IZA (Internet customs declaration for private imports).
 */

import type { ProcedureMeta } from "../../types";

export const IZA_V1_META: ProcedureMeta = {
  code: "IZA",
  version: "v1",
  name: "Internetbestellung – Import Zollanmeldung",
  shortDescription:
    "Für Privatpersonen, die Waren aus dem Nicht-EU-Ausland bestellen und diese verzollen möchten.",
  targetAudience: "PRIVATE",
  isActive: true,
};
