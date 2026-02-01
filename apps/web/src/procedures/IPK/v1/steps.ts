/**
 * IPK v1 - Wizard Steps Configuration
 *
 * Defines the wizard steps and fields for IPK procedure.
 * IPK v1 focuses on: Grunddaten, Warenwert, Herkunft
 */

import type { ProcedureStepsConfig } from "../../types";

export const IPK_V1_STEPS: ProcedureStepsConfig = {
  procedureCode: "IPK",
  procedureVersion: "v1",
  steps: [
    {
      stepKey: "grunddaten",
      title: "Grunddaten",
      description: "Allgemeine Angaben zur Sendung",
      order: 1,
      fields: [
        {
          fieldKey: "sendungsnummer",
          fieldType: "TEXT",
          required: true,
          order: 1,
          config: {
            title: "Sendungsnummer",
            placeholder: "z.B. 1Z999AA10123456784",
            description: "Tracking-Nummer oder interne Referenz",
            maxLength: 50,
          },
        },
        {
          fieldKey: "contents_description",
          fieldType: "TEXT",
          required: true,
          order: 2,
          config: {
            title: "Warenbeschreibung",
            placeholder: "z.B. Elektronikbauteile, Textilien...",
            description: "Was enthält die Sendung?",
            maxLength: 500,
          },
        },
        {
          fieldKey: "quantity",
          fieldType: "NUMBER",
          required: true,
          order: 3,
          config: {
            title: "Anzahl Packstücke",
            placeholder: "1",
            description: "Wie viele Packstücke umfasst die Sendung?",
            min: 1,
            step: 1,
          },
        },
        {
          fieldKey: "weight_kg",
          fieldType: "NUMBER",
          required: true,
          order: 4,
          config: {
            title: "Gewicht (kg)",
            placeholder: "0.00",
            description: "Bruttogewicht der Sendung in Kilogramm",
            min: 0.01,
            step: 0.01,
          },
        },
      ],
    },
    {
      stepKey: "warenwert",
      title: "Warenwert",
      description: "Angaben zum Wert der importierten Waren",
      order: 2,
      fields: [
        {
          fieldKey: "value_amount",
          fieldType: "NUMBER",
          required: true,
          order: 1,
          config: {
            title: "Warenwert",
            placeholder: "0.00",
            description: "Gesamtwert der Waren (Rechnungsbetrag)",
            min: 0.01,
            step: 0.01,
          },
        },
        {
          fieldKey: "value_currency",
          fieldType: "CURRENCY",
          required: true,
          order: 2,
          config: {
            title: "Währung",
            placeholder: "Währung wählen",
            description: "Währung des Rechnungsbetrags",
          },
        },
        {
          fieldKey: "shipping_cost",
          fieldType: "NUMBER",
          required: false,
          order: 3,
          config: {
            title: "Versandkosten",
            placeholder: "0.00",
            description: "Kosten für Transport und Versicherung (optional)",
            min: 0,
            step: 0.01,
          },
        },
        {
          fieldKey: "invoice_number",
          fieldType: "TEXT",
          required: false,
          order: 4,
          config: {
            title: "Rechnungsnummer",
            placeholder: "z.B. INV-2026-001",
            description: "Nummer der Handelsrechnung (falls vorhanden)",
            maxLength: 50,
          },
        },
      ],
    },
    {
      stepKey: "herkunft",
      title: "Herkunft",
      description: "Angaben zur Herkunft und zum Lieferanten",
      order: 3,
      fields: [
        {
          fieldKey: "origin_country",
          fieldType: "COUNTRY",
          required: true,
          order: 1,
          config: {
            title: "Herkunftsland",
            placeholder: "Land wählen",
            description: "Land, in dem die Ware hergestellt wurde",
          },
        },
        {
          fieldKey: "sender_name",
          fieldType: "TEXT",
          required: true,
          order: 2,
          config: {
            title: "Lieferant / Absender",
            placeholder: "Firmenname des Lieferanten",
            description: "Name des Unternehmens, das die Ware versendet",
            maxLength: 200,
          },
        },
        {
          fieldKey: "sender_country",
          fieldType: "COUNTRY",
          required: true,
          order: 3,
          config: {
            title: "Land des Lieferanten",
            placeholder: "Land wählen",
            description: "Sitzland des Lieferanten",
          },
        },
        {
          fieldKey: "sender_address",
          fieldType: "TEXT",
          required: false,
          order: 4,
          config: {
            title: "Adresse des Lieferanten",
            placeholder: "Straße, PLZ, Ort",
            description: "Vollständige Adresse (optional)",
            maxLength: 300,
          },
        },
      ],
    },
  ],
};
