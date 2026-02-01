/**
 * IAA v1 - Mapping Configuration
 *
 * Defines how each field maps to customs forms for export declarations.
 */

import type { ProcedureMappingConfig } from "../../types";

export const IAA_V1_MAPPING: ProcedureMappingConfig = {
  procedureCode: "IAA",
  procedureVersion: "v1",
  displayName: "Internet-Ausfuhranmeldung",
  formName: "Ausfuhranmeldung (Internet)",
  mappings: [
    // === Absender (Ausführer) ===
    {
      fieldKey: "sender_company",
      label: "Firmenname",
      targetForm: "IAA – Ausführer",
      targetField: 'Feld „Name/Firma"',
      hint: "Der vollständige Firmenname wie im Handelsregister eingetragen.",
    },
    {
      fieldKey: "sender_name",
      label: "Ansprechpartner",
      targetForm: "IAA – Ausführer",
      targetField: 'Feld „Ansprechpartner"',
      hint: "Kontaktperson für Rückfragen der Zollbehörde.",
    },
    {
      fieldKey: "sender_address",
      label: "Adresse",
      targetForm: "IAA – Ausführer",
      targetField: 'Feld „Straße/Hausnummer"',
      hint: "Die Geschäftsadresse des ausführenden Unternehmens.",
    },
    {
      fieldKey: "sender_postcode",
      label: "Postleitzahl",
      targetForm: "IAA – Ausführer",
      targetField: 'Feld „PLZ"',
      hint: "Die deutsche Postleitzahl.",
    },
    {
      fieldKey: "sender_city",
      label: "Stadt",
      targetForm: "IAA – Ausführer",
      targetField: 'Feld „Ort"',
      hint: "Der Standort des Unternehmens.",
    },
    {
      fieldKey: "sender_country",
      label: "Land",
      targetForm: "IAA – Ausführer",
      targetField: 'Feld „Land"',
      hint: "Bei Ausfuhren aus Deutschland: Deutschland.",
    },

    // === Empfänger ===
    {
      fieldKey: "recipient_company",
      label: "Firma des Empfängers",
      targetForm: "IAA – Empfänger",
      targetField: 'Feld „Name/Firma"',
      hint: "Der Firmenname des Empfängers, falls zutreffend.",
    },
    {
      fieldKey: "recipient_name",
      label: "Name des Empfängers",
      targetForm: "IAA – Empfänger",
      targetField: 'Feld „Ansprechpartner"',
      hint: "Der Name der Person oder des Unternehmens, das die Ware erhält.",
    },
    {
      fieldKey: "recipient_address",
      label: "Adresse",
      targetForm: "IAA – Empfänger",
      targetField: 'Feld „Anschrift"',
      hint: "Die vollständige Lieferadresse im Bestimmungsland.",
    },
    {
      fieldKey: "recipient_city",
      label: "Stadt / Ort",
      targetForm: "IAA – Empfänger",
      targetField: 'Feld „Ort"',
      hint: "Stadt oder Ort der Lieferadresse.",
    },
    {
      fieldKey: "recipient_postcode",
      label: "Postleitzahl",
      targetForm: "IAA – Empfänger",
      targetField: 'Feld „PLZ"',
      hint: "Die Postleitzahl im Zielland (falls üblich).",
    },
    {
      fieldKey: "recipient_country",
      label: "Bestimmungsland",
      targetForm: "IAA – Empfänger",
      targetField: 'Feld „Land"',
      hint: "Das Land, in das die Ware exportiert wird.",
    },

    // === Geschäftsart ===
    {
      fieldKey: "export_type",
      label: "Art der Ausfuhr",
      targetForm: "IAA – Geschäftsart",
      targetField: 'Feld „Geschäftsart"',
      hint: "Kennzeichnet den Grund der Ausfuhr (Verkauf, Muster, Reparatur etc.).",
    },
    {
      fieldKey: "contents_description",
      label: "Warenbeschreibung",
      targetForm: "IAA – Geschäftsart",
      targetField: 'Feld „Warenbezeichnung"',
      hint: "Eine genaue Beschreibung der Ausfuhrwaren.",
    },
    {
      fieldKey: "value_amount",
      label: "Warenwert",
      targetForm: "IAA – Geschäftsart",
      targetField: 'Feld „Statistischer Wert"',
      hint: "Der Wert der Waren am Ort und zum Zeitpunkt der Ausfuhr.",
    },
    {
      fieldKey: "value_currency",
      label: "Währung",
      targetForm: "IAA – Geschäftsart",
      targetField: 'Feld „Währung"',
      hint: "Die Währung des angegebenen Warenwerts.",
    },
    {
      fieldKey: "weight_kg",
      label: "Gewicht",
      targetForm: "IAA – Geschäftsart",
      targetField: 'Feld „Rohmasse (kg)"',
      hint: "Das Bruttogewicht der Sendung in Kilogramm.",
    },
    {
      fieldKey: "remarks",
      label: "Bemerkungen",
      targetForm: "IAA – Geschäftsart",
      targetField: 'Feld „Bemerkungen"',
      hint: "Zusätzliche Informationen zur Ausfuhr.",
    },
  ],
};
