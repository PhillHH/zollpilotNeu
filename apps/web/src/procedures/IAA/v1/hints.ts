/**
 * IAA v1 - Hints Configuration
 *
 * Knowledge base explanations for IAA procedure fields.
 */

import type { ProcedureHintsConfig } from "../../types";

export const IAA_V1_HINTS: ProcedureHintsConfig = {
  procedureCode: "IAA",
  procedureVersion: "v1",
  hints: [
    {
      fieldKey: "export_type",
      title: "Welche Geschäftsart wähle ich?",
      summary:
        "Die Geschäftsart beschreibt den Grund für den Export und beeinflusst die zollrechtliche Behandlung.",
      explanation:
        "Wählen Sie die zutreffende Geschäftsart:\n- **Verkauf**: Endgültiger Verkauf an einen Käufer im Ausland\n- **Muster**: Kostenlose Muster zu Werbezwecken\n- **Reparatur**: Vorübergehende Ausfuhr zur Reparatur\n- **Rücksendung**: Rückgabe an den ursprünglichen Lieferanten\n- **Sonstige**: Andere Gründe (z.B. Geschenk, Leihgabe)",
    },
    {
      fieldKey: "recipient_country",
      title: "Wohin darf ich exportieren?",
      summary:
        "Für die IAA-Anmeldung muss das Bestimmungsland außerhalb der EU liegen.",
      explanation:
        "Die Internet-Ausfuhranmeldung gilt für Exporte in Drittländer (Nicht-EU-Staaten). Für Lieferungen innerhalb der EU benötigen Sie keine Ausfuhranmeldung. Beachten Sie mögliche Exportbeschränkungen für bestimmte Länder (Embargos) oder Warenarten (Dual-Use-Güter).",
    },
    {
      fieldKey: "sender_country",
      title: "Warum muss der Absender in Deutschland sein?",
      summary:
        "Die Internet-Ausfuhranmeldung ist für Ausfuhren aus Deutschland vorgesehen.",
      explanation:
        "Das IAA-Verfahren wird bei deutschen Zollbehörden durchgeführt. Der Ausführer muss daher in Deutschland ansässig sein oder hier eine Betriebsstätte haben. Für Ausfuhren aus anderen EU-Ländern gelten die dortigen nationalen Verfahren.",
    },
    {
      fieldKey: "value_amount",
      title: "Wie bestimme ich den Warenwert?",
      summary:
        "Der Warenwert ist der statistische Wert der Waren am Ort und Zeitpunkt der Ausfuhr.",
      explanation:
        "Der anzugebende Wert ist der Preis, der bei einem Verkauf zwischen unabhängigen Parteien gezahlt würde. Bei Verkäufen ist dies der Rechnungsbetrag. Bei Mustern oder kostenlosen Sendungen geben Sie den geschätzten Marktwert an. Der Wert sollte die Waren am Ort der Ausfuhr (frei deutsche Grenze) bewerten.",
    },
  ],
};
