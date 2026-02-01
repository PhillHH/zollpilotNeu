/**
 * IZA v1 - Hints Configuration
 *
 * Knowledge base explanations for IZA procedure fields.
 */

import type { ProcedureHintsConfig } from "../../types";

export const IZA_V1_HINTS: ProcedureHintsConfig = {
  procedureCode: "IZA",
  procedureVersion: "v1",
  hints: [
    {
      fieldKey: "value_amount",
      title: "Was ist der Warenwert?",
      summary:
        "Der Warenwert ist der tatsächliche Kaufpreis der Ware ohne Versandkosten.",
      explanation:
        "Der Warenwert ist die Bemessungsgrundlage für Zölle und Einfuhrumsatzsteuer. Geben Sie den Betrag an, den Sie tatsächlich für die Ware bezahlt haben. Versandkosten werden separat erfasst. Bei Geschenken geben Sie den geschätzten Marktwert an.",
    },
    {
      fieldKey: "origin_country",
      title: "Warum ist das Herkunftsland wichtig?",
      summary:
        "Das Herkunftsland bestimmt, welche Zollsätze und Handelsabkommen gelten.",
      explanation:
        "Je nach Herkunftsland können unterschiedliche Zollsätze gelten. Mit manchen Ländern hat die EU Freihandelsabkommen, die zu reduzierten oder keinen Zöllen führen können. Das Herkunftsland ist das Land, in dem die Ware hergestellt oder wesentlich verarbeitet wurde – nicht unbedingt das Versandland.",
    },
    {
      fieldKey: "commercial_goods",
      title: "Was sind gewerbliche Waren?",
      summary:
        "Gewerbliche Waren sind für den Wiederverkauf oder geschäftliche Nutzung bestimmt.",
      explanation:
        "Wenn Sie Waren zum Weiterverkauf, für Ihr Unternehmen oder in größeren Mengen importieren, handelt es sich um gewerbliche Waren. Für Privatpersonen, die Waren für den persönlichen Gebrauch bestellen, ist dies normalerweise nicht der Fall. Bei gewerblichen Waren gelten andere Regelungen und ggf. zusätzliche Anforderungen.",
    },
    {
      fieldKey: "sender_country",
      title: "Warum muss ich das Absenderland angeben?",
      summary:
        "Das Absenderland ist wichtig für die Zollabwicklung und Risikoprüfung.",
      explanation:
        "Der Zoll muss wissen, woher die Sendung kommt, um die richtige Behandlung zu bestimmen. Das Absenderland kann vom Herkunftsland der Ware abweichen, z.B. wenn ein Händler aus einem anderen Land versendet als dem, in dem die Ware hergestellt wurde.",
    },
    {
      fieldKey: "recipient_country",
      title: "Warum ist Deutschland als Empfängerland wichtig?",
      summary:
        "Für eine IZA-Anmeldung muss der Empfänger in Deutschland sein.",
      explanation:
        "Die Internetanmeldung (IZA) ist für Importe nach Deutschland gedacht. Der Empfänger muss daher eine deutsche Adresse haben. Für Importe in andere EU-Länder gelten andere Verfahren.",
    },
  ],
};
