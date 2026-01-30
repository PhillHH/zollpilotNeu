/**
 * Mapping-Konfiguration für Zollformulare
 *
 * Diese Datei definiert, wo die vom Nutzer eingegebenen Werte
 * im entsprechenden Zollformular einzutragen sind.
 *
 * Struktur pro Verfahren/Version:
 * - fieldKey: Schlüssel des Feldes im Case
 * - label: Alltagssprachliche Bezeichnung
 * - targetForm: Zielformular/-seite (z.B. "IZA – Seite 2")
 * - targetField: Feldnummer/-name (z.B. "Feld 22")
 * - hint: Optionale Erklärung ("Warum fragt der Zoll das?")
 */

export type FieldMapping = {
  fieldKey: string;
  label: string;
  targetForm: string;
  targetField: string;
  hint?: string;
};

export type ProcedureMappingConfig = {
  procedureCode: string;
  procedureVersion: string;
  displayName: string;
  formName: string;
  mappings: FieldMapping[];
};

/**
 * IZA v1 – Internetbestellung Zollanmeldung
 *
 * Das IZA-Formular wird verwendet für Importe aus dem Nicht-EU-Ausland.
 * Die Felder entsprechen den Angaben im Online-Zollformular.
 */
export const IZA_V1_MAPPING: ProcedureMappingConfig = {
  procedureCode: "IZA",
  procedureVersion: "v1",
  displayName: "Import Zollanmeldung",
  formName: "Internetanmeldung Zoll (IZA)",
  mappings: [
    // === Paket / Sendung ===
    {
      fieldKey: "content",
      label: "Inhalt der Sendung",
      targetForm: "IZA – Angaben zur Sendung",
      targetField: 'Feld „Warenbeschreibung"',
      hint: "Beschreiben Sie den Inhalt so genau wie möglich. Der Zoll prüft, ob die Angaben mit der Sendung übereinstimmen."
    },
    {
      fieldKey: "value_amount",
      label: "Warenwert (Betrag)",
      targetForm: "IZA – Angaben zur Sendung",
      targetField: 'Feld „Warenwert"',
      hint: "Geben Sie den tatsächlichen Kaufpreis an. Zu niedrige Angaben können zu Nachforderungen führen."
    },
    {
      fieldKey: "value_currency",
      label: "Währung",
      targetForm: "IZA – Angaben zur Sendung",
      targetField: 'Feld „Währung"',
      hint: "Wählen Sie die Währung, in der Sie bezahlt haben. Der Zoll rechnet automatisch in Euro um."
    },
    {
      fieldKey: "origin_country",
      label: "Herkunftsland",
      targetForm: "IZA – Angaben zur Sendung",
      targetField: 'Feld „Ursprungsland"',
      hint: "Das Land, in dem die Ware hergestellt wurde – nicht das Versandland."
    },
    {
      fieldKey: "commercial_goods",
      label: "Gewerbliche Waren",
      targetForm: "IZA – Angaben zur Sendung",
      targetField: 'Feld „Verwendungszweck"',
      hint: "Geben Sie an, ob die Waren für gewerbliche Zwecke (Wiederverkauf) bestimmt sind."
    },

    // === Versender ===
    {
      fieldKey: "sender_name",
      label: "Name des Versenders",
      targetForm: "IZA – Versender",
      targetField: 'Feld „Name/Firma"',
      hint: "Der Name des Absenders wie auf dem Paket angegeben."
    },
    {
      fieldKey: "sender_country",
      label: "Land des Versenders",
      targetForm: "IZA – Versender",
      targetField: 'Feld „Land"',
      hint: "Das Land, aus dem die Sendung versendet wurde."
    },

    // === Empfänger ===
    {
      fieldKey: "recipient_name",
      label: "Name des Empfängers",
      targetForm: "IZA – Empfänger",
      targetField: 'Feld „Name"',
      hint: "Ihr vollständiger Name, wie er auf dem Paket steht."
    },
    {
      fieldKey: "recipient_country",
      label: "Land des Empfängers",
      targetForm: "IZA – Empfänger",
      targetField: 'Feld „Land"',
      hint: "Deutschland – Importe müssen nach Deutschland gehen."
    },

    // === Zusätzliche Angaben ===
    {
      fieldKey: "remarks",
      label: "Bemerkungen",
      targetForm: "IZA – Zusätzliche Angaben",
      targetField: 'Feld „Bemerkungen"',
      hint: "Zusätzliche Informationen wie Bestellnummer, Tracking-ID oder besondere Umstände."
    }
  ]
};

/**
 * Alle verfügbaren Mapping-Konfigurationen
 */
export const MAPPING_CONFIGS: Record<string, ProcedureMappingConfig> = {
  "IZA:v1": IZA_V1_MAPPING,
};

/**
 * Hilfsfunktion: Mapping-Konfiguration für ein Verfahren abrufen
 */
export function getMappingConfig(
  procedureCode: string,
  procedureVersion: string
): ProcedureMappingConfig | null {
  const key = `${procedureCode}:${procedureVersion}`;
  return MAPPING_CONFIGS[key] ?? null;
}

/**
 * Hilfsfunktion: Mapping für ein einzelnes Feld abrufen
 */
export function getFieldMapping(
  procedureCode: string,
  procedureVersion: string,
  fieldKey: string
): FieldMapping | null {
  const config = getMappingConfig(procedureCode, procedureVersion);
  if (!config) return null;
  return config.mappings.find((m) => m.fieldKey === fieldKey) ?? null;
}
