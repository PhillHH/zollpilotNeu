/**
 * IZA v1 - Wizard Steps Configuration
 *
 * Defines the wizard steps and fields for IZA procedure.
 * This configuration mirrors the database structure for frontend rendering.
 */

import type { ProcedureStepsConfig } from "../../types";

export const IZA_V1_STEPS: ProcedureStepsConfig = {
  procedureCode: "IZA",
  procedureVersion: "v1",
  steps: [
    {
      stepKey: "package",
      title: "Paket",
      description: "Angaben zu Inhalt und Wert deiner Sendung",
      order: 1,
      fields: [
        {
          fieldKey: "contents_description",
          fieldType: "TEXT",
          required: true,
          order: 1,
          config: {
            title: "Inhaltsbeschreibung",
            placeholder: "z.B. Elektronik, Kleidung, Bücher...",
            description: "Was ist in deinem Paket?",
            maxLength: 500,
          },
        },
        {
          fieldKey: "value_amount",
          fieldType: "NUMBER",
          required: true,
          order: 2,
          config: {
            title: "Warenwert",
            placeholder: "0.00",
            description: "Gesamtwert der Ware (ohne Versandkosten)",
            min: 0.01,
            step: 0.01,
          },
        },
        {
          fieldKey: "value_currency",
          fieldType: "CURRENCY",
          required: true,
          order: 3,
          config: {
            title: "Währung",
            placeholder: "Währung wählen",
            description: "In welcher Währung wurde bezahlt?",
          },
        },
        {
          fieldKey: "origin_country",
          fieldType: "COUNTRY",
          required: true,
          order: 4,
          config: {
            title: "Herkunftsland",
            placeholder: "Land wählen",
            description: "Aus welchem Land wird das Paket versendet?",
          },
        },
      ],
    },
    {
      stepKey: "sender",
      title: "Absender",
      description: "Angaben zum Versender der Ware",
      order: 2,
      fields: [
        {
          fieldKey: "sender_name",
          fieldType: "TEXT",
          required: true,
          order: 1,
          config: {
            title: "Name des Absenders",
            placeholder: "z.B. AliExpress oder Firmenname",
            description: "Wer hat das Paket versendet?",
            maxLength: 200,
          },
        },
        {
          fieldKey: "sender_country",
          fieldType: "COUNTRY",
          required: true,
          order: 2,
          config: {
            title: "Land des Absenders",
            placeholder: "Land wählen",
            description: "In welchem Land sitzt der Absender?",
          },
        },
      ],
    },
    {
      stepKey: "recipient",
      title: "Empfänger",
      description: "Angaben zur Lieferadresse in Deutschland",
      order: 3,
      fields: [
        {
          fieldKey: "recipient_full_name",
          fieldType: "TEXT",
          required: true,
          order: 1,
          config: {
            title: "Vollständiger Name",
            placeholder: "Vor- und Nachname",
            description: "An wen ist das Paket adressiert?",
            maxLength: 200,
          },
        },
        {
          fieldKey: "recipient_address",
          fieldType: "TEXT",
          required: true,
          order: 2,
          config: {
            title: "Straße und Hausnummer",
            placeholder: "z.B. Musterstraße 123",
            maxLength: 200,
          },
        },
        {
          fieldKey: "recipient_postcode",
          fieldType: "TEXT",
          required: true,
          order: 3,
          config: {
            title: "Postleitzahl",
            placeholder: "z.B. 12345",
            maxLength: 10,
          },
        },
        {
          fieldKey: "recipient_city",
          fieldType: "TEXT",
          required: true,
          order: 4,
          config: {
            title: "Stadt",
            placeholder: "z.B. Berlin",
            maxLength: 100,
          },
        },
        {
          fieldKey: "recipient_country",
          fieldType: "COUNTRY",
          required: true,
          order: 5,
          config: {
            title: "Land",
            placeholder: "Land wählen",
            description: "Wohin soll geliefert werden?",
            default: "DE",
          },
        },
      ],
    },
    {
      stepKey: "additional",
      title: "Zusätzliche Angaben",
      description: "Weitere Informationen für den Zoll",
      order: 4,
      fields: [
        {
          fieldKey: "commercial_goods",
          fieldType: "BOOLEAN",
          required: true,
          order: 1,
          config: {
            label: "Gewerbliche Einfuhr",
            description:
              "Handelt es sich um gewerbliche Ware (zum Weiterverkauf)?",
          },
        },
        {
          fieldKey: "remarks",
          fieldType: "TEXT",
          required: false,
          order: 2,
          config: {
            title: "Bemerkungen",
            placeholder: "Optionale Anmerkungen für den Zoll",
            description:
              "Zusätzliche Informationen (z.B. Geschenksendung, Muster)",
            maxLength: 1000,
          },
        },
      ],
    },
  ],
};
