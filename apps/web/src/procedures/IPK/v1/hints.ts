/**
 * IPK v1 - Hints Configuration
 *
 * Knowledge base explanations for IPK procedure fields.
 */

import type { ProcedureHintsConfig } from "../../types";

export const IPK_V1_HINTS: ProcedureHintsConfig = {
  procedureCode: "IPK",
  procedureVersion: "v1",
  hints: [
    {
      fieldKey: "value_amount",
      title: "Wie wird der Zollwert berechnet?",
      summary:
        "Der Zollwert basiert auf dem Transaktionswert (Kaufpreis) plus Transportkosten bis zur EU-Grenze.",
      explanation:
        "Für die Zollberechnung wird der sogenannte CIF-Wert herangezogen: Cost (Warenwert) + Insurance (Versicherung) + Freight (Fracht bis zur EU-Grenze). Geben Sie den tatsächlichen Rechnungsbetrag an. Die Versandkosten können separat erfasst werden.",
    },
    {
      fieldKey: "origin_country",
      title: "Unterschied zwischen Ursprungsland und Versendungsland",
      summary:
        "Das Ursprungsland ist, wo die Ware hergestellt wurde. Das Versendungsland ist, woher sie verschickt wird.",
      explanation:
        "Beispiel: Ein Produkt wird in China hergestellt, aber von einem Händler in Hong Kong verschickt. Das Ursprungsland ist China, das Versendungsland ist Hong Kong. Für Zölle und Handelsabkommen ist das Ursprungsland entscheidend.",
    },
    {
      fieldKey: "shipping_cost",
      title: "Warum sind Versandkosten wichtig?",
      summary:
        "Versandkosten fließen in den Zollwert ein und erhöhen damit die Bemessungsgrundlage.",
      explanation:
        "Der Zoll wird nicht nur auf den Warenwert, sondern auf den CIF-Wert berechnet. Das bedeutet, dass Transport- und Versicherungskosten bis zur EU-Grenze hinzugerechnet werden. Je höher die Versandkosten, desto höher die Zollabgaben.",
    },
    {
      fieldKey: "sendungsnummer",
      title: "Wozu dient die Sendungsnummer?",
      summary:
        "Die Sendungsnummer ermöglicht die eindeutige Zuordnung Ihrer Zollanmeldung zur Sendung.",
      explanation:
        "Mit der Tracking- oder Referenznummer kann der Zoll die Sendung bei der Prüfung eindeutig identifizieren. Verwenden Sie die Nummer, die Ihnen vom Spediteur oder Versanddienstleister mitgeteilt wurde.",
    },
  ],
};
