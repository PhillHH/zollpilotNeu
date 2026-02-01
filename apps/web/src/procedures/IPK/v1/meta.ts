/**
 * IPK v1 - Import-Paketverkehr
 *
 * Procedure metadata for IPK (Import parcel traffic for small businesses).
 */

import type { ProcedureMeta } from "../../types";

export const IPK_V1_META: ProcedureMeta = {
  code: "IPK",
  version: "v1",
  name: "Import-Paketverkehr",
  shortDescription:
    "Für Kleinunternehmen, die regelmäßig Pakete aus dem Nicht-EU-Ausland importieren.",
  targetAudience: "BUSINESS",
  isActive: true,
};
