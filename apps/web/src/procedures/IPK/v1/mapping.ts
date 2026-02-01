/**
 * IPK v1 - Mapping Configuration
 *
 * Defines how each field maps to customs forms for import parcel traffic.
 */

import type { ProcedureMappingConfig } from "../../types";

export const IPK_V1_MAPPING: ProcedureMappingConfig = {
  procedureCode: "IPK",
  procedureVersion: "v1",
  displayName: "Import-Paketverkehr",
  formName: "Zollanmeldung Import (Paketverkehr)",
  mappings: [
    // === Grunddaten ===
    {
      fieldKey: "sendungsnummer",
      label: "Sendungsnummer",
      targetForm: "IPK – Grunddaten",
      targetField: 'Feld „Bezugsnummer"',
      hint: "Die Tracking- oder Referenznummer zur eindeutigen Identifikation der Sendung.",
    },
    {
      fieldKey: "contents_description",
      label: "Warenbeschreibung",
      targetForm: "IPK – Grunddaten",
      targetField: 'Feld „Warenbezeichnung"',
      hint: "Beschreiben Sie die Waren möglichst genau. Der Zoll benötigt dies für die Tarifierung.",
    },
    {
      fieldKey: "quantity",
      label: "Anzahl Packstücke",
      targetForm: "IPK – Grunddaten",
      targetField: 'Feld „Packstücke"',
      hint: "Die Anzahl der einzelnen Pakete oder Kartons.",
    },
    {
      fieldKey: "weight_kg",
      label: "Gewicht",
      targetForm: "IPK – Grunddaten",
      targetField: 'Feld „Rohgewicht (kg)"',
      hint: "Das Bruttogewicht inklusive Verpackung.",
    },

    // === Warenwert ===
    {
      fieldKey: "value_amount",
      label: "Warenwert",
      targetForm: "IPK – Warenwert",
      targetField: 'Feld „Rechnungsbetrag"',
      hint: "Der tatsächliche Kaufpreis laut Handelsrechnung.",
    },
    {
      fieldKey: "value_currency",
      label: "Währung",
      targetForm: "IPK – Warenwert",
      targetField: 'Feld „Währung"',
      hint: "Die Währung des Rechnungsbetrags. Wird vom Zoll in EUR umgerechnet.",
    },
    {
      fieldKey: "shipping_cost",
      label: "Versandkosten",
      targetForm: "IPK – Warenwert",
      targetField: 'Feld „Beförderungskosten"',
      hint: "Transport- und Versicherungskosten bis zur EU-Grenze (CIF-Wert).",
    },
    {
      fieldKey: "invoice_number",
      label: "Rechnungsnummer",
      targetForm: "IPK – Warenwert",
      targetField: 'Feld „Rechnungsnummer"',
      hint: "Die Nummer der Handelsrechnung für die Zollprüfung.",
    },

    // === Herkunft ===
    {
      fieldKey: "origin_country",
      label: "Herkunftsland",
      targetForm: "IPK – Herkunft",
      targetField: 'Feld „Ursprungsland"',
      hint: "Das Land, in dem die Ware hergestellt oder wesentlich verarbeitet wurde.",
    },
    {
      fieldKey: "sender_name",
      label: "Lieferant",
      targetForm: "IPK – Herkunft",
      targetField: 'Feld „Versender/Ausführer"',
      hint: "Name des Unternehmens, das die Ware versendet.",
    },
    {
      fieldKey: "sender_country",
      label: "Land des Lieferanten",
      targetForm: "IPK – Herkunft",
      targetField: 'Feld „Versendungsland"',
      hint: "Das Land, aus dem die Sendung abgeschickt wurde.",
    },
    {
      fieldKey: "sender_address",
      label: "Adresse des Lieferanten",
      targetForm: "IPK – Herkunft",
      targetField: 'Feld „Anschrift Versender"',
      hint: "Die vollständige Geschäftsadresse des Lieferanten.",
    },
  ],
};
