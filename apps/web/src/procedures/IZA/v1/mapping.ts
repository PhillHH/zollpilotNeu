/**
 * IZA v1 - Mapping Configuration
 *
 * Defines how each field maps to the official Zoll form.
 */

import type { ProcedureMappingConfig } from "../../types";

export const IZA_V1_MAPPING: ProcedureMappingConfig = {
  procedureCode: "IZA",
  procedureVersion: "v1",
  displayName: "Import Zollanmeldung",
  formName: "Internetanmeldung Zoll (IZA)",
  mappings: [
    // === Paket / Sendung ===
    {
      fieldKey: "contents_description",
      label: "Inhalt der Sendung",
      targetForm: "IZA – Angaben zur Sendung",
      targetField: 'Feld „Warenbeschreibung"',
      hint: "Beschreiben Sie den Inhalt so genau wie möglich. Der Zoll prüft, ob die Angaben mit der Sendung übereinstimmen.",
    },
    {
      fieldKey: "value_amount",
      label: "Warenwert (Betrag)",
      targetForm: "IZA – Angaben zur Sendung",
      targetField: 'Feld „Warenwert"',
      hint: "Geben Sie den tatsächlichen Kaufpreis an. Zu niedrige Angaben können zu Nachforderungen führen.",
    },
    {
      fieldKey: "value_currency",
      label: "Währung",
      targetForm: "IZA – Angaben zur Sendung",
      targetField: 'Feld „Währung"',
      hint: "Wählen Sie die Währung, in der Sie bezahlt haben. Der Zoll rechnet automatisch in Euro um.",
    },
    {
      fieldKey: "origin_country",
      label: "Herkunftsland",
      targetForm: "IZA – Angaben zur Sendung",
      targetField: 'Feld „Ursprungsland"',
      hint: "Das Land, in dem die Ware hergestellt wurde – nicht das Versandland.",
    },
    {
      fieldKey: "commercial_goods",
      label: "Gewerbliche Waren",
      targetForm: "IZA – Angaben zur Sendung",
      targetField: 'Feld „Verwendungszweck"',
      hint: "Geben Sie an, ob die Waren für gewerbliche Zwecke (Wiederverkauf) bestimmt sind.",
    },

    // === Versender ===
    {
      fieldKey: "sender_name",
      label: "Name des Versenders",
      targetForm: "IZA – Versender",
      targetField: 'Feld „Name/Firma"',
      hint: "Der Name des Absenders wie auf dem Paket angegeben.",
    },
    {
      fieldKey: "sender_country",
      label: "Land des Versenders",
      targetForm: "IZA – Versender",
      targetField: 'Feld „Land"',
      hint: "Das Land, aus dem die Sendung versendet wurde.",
    },

    // === Empfänger ===
    {
      fieldKey: "recipient_full_name",
      label: "Name des Empfängers",
      targetForm: "IZA – Empfänger",
      targetField: 'Feld „Name"',
      hint: "Ihr vollständiger Name, wie er auf dem Paket steht.",
    },
    {
      fieldKey: "recipient_address",
      label: "Adresse des Empfängers",
      targetForm: "IZA – Empfänger",
      targetField: 'Feld „Straße/Hausnummer"',
      hint: "Die vollständige Lieferadresse.",
    },
    {
      fieldKey: "recipient_postcode",
      label: "Postleitzahl",
      targetForm: "IZA – Empfänger",
      targetField: 'Feld „PLZ"',
      hint: "Die deutsche Postleitzahl.",
    },
    {
      fieldKey: "recipient_city",
      label: "Stadt",
      targetForm: "IZA – Empfänger",
      targetField: 'Feld „Ort"',
      hint: "Der Ort der Lieferadresse.",
    },
    {
      fieldKey: "recipient_country",
      label: "Land des Empfängers",
      targetForm: "IZA – Empfänger",
      targetField: 'Feld „Land"',
      hint: "Deutschland – Importe müssen nach Deutschland gehen.",
    },

    // === Zusätzliche Angaben ===
    {
      fieldKey: "remarks",
      label: "Bemerkungen",
      targetForm: "IZA – Zusätzliche Angaben",
      targetField: 'Feld „Bemerkungen"',
      hint: "Zusätzliche Informationen wie Bestellnummer, Tracking-ID oder besondere Umstände.",
    },
  ],
};
