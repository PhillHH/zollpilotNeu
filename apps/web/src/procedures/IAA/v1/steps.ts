/**
 * IAA v1 - Wizard Steps Configuration
 *
 * Defines the wizard steps and fields for IAA procedure.
 * IAA v1 focuses on: Absender, Empfänger, Geschäftsart
 */

import type { ProcedureStepsConfig } from "../../types";

export const IAA_V1_STEPS: ProcedureStepsConfig = {
  procedureCode: "IAA",
  procedureVersion: "v1",
  steps: [
    {
      stepKey: "absender",
      title: "Absender",
      description: "Angaben zum Ausführer/Versender aus Deutschland",
      order: 1,
      fields: [
        {
          fieldKey: "sender_company",
          fieldType: "TEXT",
          required: true,
          order: 1,
          config: {
            title: "Firmenname",
            placeholder: "z.B. Musterfirma GmbH",
            description: "Name Ihres Unternehmens",
            maxLength: 200,
          },
        },
        {
          fieldKey: "sender_name",
          fieldType: "TEXT",
          required: true,
          order: 2,
          config: {
            title: "Ansprechpartner",
            placeholder: "Vor- und Nachname",
            description: "Kontaktperson für Rückfragen",
            maxLength: 100,
          },
        },
        {
          fieldKey: "sender_address",
          fieldType: "TEXT",
          required: true,
          order: 3,
          config: {
            title: "Straße und Hausnummer",
            placeholder: "z.B. Industriestraße 10",
            maxLength: 200,
          },
        },
        {
          fieldKey: "sender_postcode",
          fieldType: "TEXT",
          required: true,
          order: 4,
          config: {
            title: "Postleitzahl",
            placeholder: "z.B. 12345",
            maxLength: 10,
          },
        },
        {
          fieldKey: "sender_city",
          fieldType: "TEXT",
          required: true,
          order: 5,
          config: {
            title: "Stadt",
            placeholder: "z.B. Hamburg",
            maxLength: 100,
          },
        },
        {
          fieldKey: "sender_country",
          fieldType: "COUNTRY",
          required: true,
          order: 6,
          config: {
            title: "Land",
            placeholder: "Land wählen",
            description: "Standort des Unternehmens",
            default: "DE",
          },
        },
      ],
    },
    {
      stepKey: "empfaenger",
      title: "Empfänger",
      description: "Angaben zum Empfänger im Ausland",
      order: 2,
      fields: [
        {
          fieldKey: "recipient_company",
          fieldType: "TEXT",
          required: false,
          order: 1,
          config: {
            title: "Firmenname (optional)",
            placeholder: "z.B. ABC Trading Co.",
            description: "Falls der Empfänger ein Unternehmen ist",
            maxLength: 200,
          },
        },
        {
          fieldKey: "recipient_name",
          fieldType: "TEXT",
          required: true,
          order: 2,
          config: {
            title: "Name des Empfängers",
            placeholder: "Name oder Ansprechpartner",
            maxLength: 200,
          },
        },
        {
          fieldKey: "recipient_address",
          fieldType: "TEXT",
          required: true,
          order: 3,
          config: {
            title: "Adresse",
            placeholder: "Straße, Hausnummer, ggf. Zusatz",
            maxLength: 300,
          },
        },
        {
          fieldKey: "recipient_city",
          fieldType: "TEXT",
          required: true,
          order: 4,
          config: {
            title: "Stadt / Ort",
            placeholder: "z.B. New York",
            maxLength: 100,
          },
        },
        {
          fieldKey: "recipient_postcode",
          fieldType: "TEXT",
          required: false,
          order: 5,
          config: {
            title: "Postleitzahl",
            placeholder: "z.B. 10001",
            description: "Falls im Zielland üblich",
            maxLength: 20,
          },
        },
        {
          fieldKey: "recipient_country",
          fieldType: "COUNTRY",
          required: true,
          order: 6,
          config: {
            title: "Bestimmungsland",
            placeholder: "Land wählen",
            description: "Wohin wird die Ware exportiert?",
          },
        },
      ],
    },
    {
      stepKey: "geschaeftsart",
      title: "Geschäftsart",
      description: "Art des Exports und Warenangaben",
      order: 3,
      fields: [
        {
          fieldKey: "export_type",
          fieldType: "SELECT",
          required: true,
          order: 1,
          config: {
            title: "Art der Ausfuhr",
            description: "Um welche Art von Export handelt es sich?",
            options: ["Verkauf", "Muster", "Reparatur", "Rücksendung", "Sonstige"],
          },
        },
        {
          fieldKey: "contents_description",
          fieldType: "TEXT",
          required: true,
          order: 2,
          config: {
            title: "Warenbeschreibung",
            placeholder: "z.B. Maschinenbauteile, Elektronikartikel...",
            description: "Genaue Beschreibung der Ausfuhrwaren",
            maxLength: 500,
          },
        },
        {
          fieldKey: "value_amount",
          fieldType: "NUMBER",
          required: true,
          order: 3,
          config: {
            title: "Warenwert",
            placeholder: "0.00",
            description: "Wert der Ausfuhrwaren",
            min: 0.01,
            step: 0.01,
          },
        },
        {
          fieldKey: "value_currency",
          fieldType: "CURRENCY",
          required: true,
          order: 4,
          config: {
            title: "Währung",
            placeholder: "Währung wählen",
            description: "Währung des Warenwerts",
          },
        },
        {
          fieldKey: "weight_kg",
          fieldType: "NUMBER",
          required: true,
          order: 5,
          config: {
            title: "Gewicht (kg)",
            placeholder: "0.00",
            description: "Bruttogewicht der Sendung",
            min: 0.01,
            step: 0.01,
          },
        },
        {
          fieldKey: "remarks",
          fieldType: "TEXT",
          required: false,
          order: 6,
          config: {
            title: "Bemerkungen",
            placeholder: "Optionale Anmerkungen",
            description: "Zusätzliche Informationen zur Ausfuhr",
            maxLength: 1000,
          },
        },
      ],
    },
  ],
};
