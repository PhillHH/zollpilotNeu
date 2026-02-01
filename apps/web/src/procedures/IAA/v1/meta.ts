/**
 * IAA v1 - Internet-Ausfuhranmeldung
 *
 * Procedure metadata for IAA (Internet export declaration).
 */

import type { ProcedureMeta } from "../../types";

export const IAA_V1_META: ProcedureMeta = {
  code: "IAA",
  version: "v1",
  name: "Internet-Ausfuhranmeldung",
  shortDescription:
    "Für Kleinunternehmen, die Waren aus Deutschland in Nicht-EU-Länder exportieren.",
  targetAudience: "BUSINESS",
  isActive: true,
};
