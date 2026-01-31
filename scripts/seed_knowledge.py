"""
Seed-Skript für die Knowledge Base (Sprint 6C – C6)

Fügt initiale Knowledge Topics und Entries in die Datenbank ein.
Ausführung: python -m scripts.seed_knowledge
"""

from prisma import Prisma

# Knowledge Topics
TOPICS = [
    {
        "code": "zollwert",
        "name": "Zollwert",
        "description": "Grundlagen zur Berechnung des Zollwerts",
        "order_index": 1,
    },
    {
        "code": "warennummer",
        "name": "Warennummer",
        "description": "Zolltarifnummer und EZT Online",
        "order_index": 2,
    },
    {
        "code": "dokumente",
        "name": "Dokumente",
        "description": "Erforderliche Unterlagen für die Zollanmeldung",
        "order_index": 3,
    },
    {
        "code": "verfahren",
        "name": "Verfahren",
        "description": "Zollverfahren und Abläufe",
        "order_index": 4,
    },
    {
        "code": "kosten",
        "name": "Kosten",
        "description": "Zollgebühren und Einfuhrumsatzsteuer",
        "order_index": 5,
    },
]

# Knowledge Entries
ENTRIES = [
    # Zollwert
    {
        "title": "Was ist der Zollwert?",
        "summary": "Der Zollwert ist die Bemessungsgrundlage für Zollgebühren und Einfuhrumsatzsteuer.",
        "explanation": """## Definition

Der **Zollwert** ist der Wert, auf dessen Basis der Zoll die Einfuhrabgaben berechnet. Er entspricht nicht einfach dem Kaufpreis.

## Zusammensetzung

Der Zollwert setzt sich zusammen aus:

1. **Warenwert** – Der tatsächlich gezahlte Kaufpreis
2. **Versandkosten** – Transportkosten bis zur EU-Außengrenze
3. **Versicherung** – Falls vorhanden

## Formel

```
Zollwert = Warenwert + Versandkosten + Versicherung
```

## Wichtig

- Nur Kosten **bis zur EU-Grenze** zählen
- Inlandsversand innerhalb der EU wird nicht eingerechnet
- Bei Währungsumrechnung gilt der Kurs am Tag der Anmeldung

## Beispiel

| Position | Betrag |
|----------|--------|
| Warenwert | 200,00 € |
| Versandkosten | 25,00 € |
| **Zollwert** | **225,00 €** |""",
        "applies_to": "ALL",
        "related_fields": ["warenwert", "versandkosten", "zollwert"],
        "topic_code": "zollwert",
    },
    {
        "title": "Wie werden Versandkosten aufgeteilt?",
        "summary": "Nur der internationale Versandanteil bis zur EU-Grenze zählt zum Zollwert.",
        "explanation": """## Grundregel

Beim Zollwert zählen nur die **Versandkosten bis zur EU-Außengrenze**.

## Typische Fälle

### Direktversand aus dem Ausland

Der gesamte Versandpreis wird zum Zollwert addiert.

### Versand über Zwischenlager

Wenn die Ware erst zu einem Lager innerhalb der EU geschickt wird:
- Nur der internationale Anteil zählt
- Inlandsversand ist nicht Teil des Zollwerts

## Beispiel

Ein Paket aus China wird nach Deutschland geliefert:

| Strecke | Kosten | Zum Zollwert? |
|---------|--------|---------------|
| China → Rotterdam | 18,00 € | ✓ Ja |
| Rotterdam → Hamburg | 5,00 € | ✗ Nein |

**Zollrelevante Versandkosten: 18,00 €**

## Nachweis

Bei Rückfragen des Zolls kann eine Aufschlüsselung der Versandkosten verlangt werden.""",
        "applies_to": "ALL",
        "related_fields": ["versandkosten", "zollwert"],
        "topic_code": "zollwert",
    },
    # Warennummer
    {
        "title": "Warum ist die Warennummer wichtig?",
        "summary": "Die Warennummer bestimmt den Zollsatz und ob Einfuhrbeschränkungen gelten.",
        "explanation": """## Was ist eine Warennummer?

Die **Warennummer** (auch Zolltarifnummer oder HS-Code) ist eine 8-stellige Nummer, die jede Ware eindeutig klassifiziert.

## Warum ist sie wichtig?

Die Warennummer bestimmt:

1. **Zollsatz** – Wie viel Prozent Zoll fällig werden
2. **Beschränkungen** – Ob Einfuhrverbote oder Genehmigungspflichten gelten
3. **Statistik** – Für Außenhandelsstatistiken

## Aufbau

```
8471 30 00
│    │  │
│    │  └── Unterposition (national)
│    └───── Unterposition (EU)
└────────── Kapitel + Position (international)
```

## Beispiele

| Ware | Warennummer | Zollsatz |
|------|-------------|----------|
| Smartphone | 8517 13 00 | 0 % |
| T-Shirt (Baumwolle) | 6109 10 00 | 12 % |
| Kopfhörer (kabellos) | 8518 30 95 | 0 % |

## Falsche Warennummer?

Eine falsche Warennummer kann zu:
- Nachzahlungen
- Strafen bei Vorsatz
- Verzögerungen bei der Abfertigung

führen.""",
        "applies_to": "ALL",
        "related_fields": ["warennummer", "zolltarif"],
        "topic_code": "warennummer",
    },
    {
        "title": "Wie finde ich die richtige Warennummer?",
        "summary": "Im EZT Online können Sie die passende Warennummer für Ihre Ware suchen.",
        "explanation": """## EZT Online

Der **Elektronische Zolltarif (EZT)** ist die offizielle Datenbank für Warennummern:
- Website: eztonline.de
- Kostenlos und öffentlich

## Schritt-für-Schritt

1. **EZT Online öffnen** (eztonline.de)
2. **Suchbegriff eingeben** (z. B. "Kopfhörer")
3. **Ergebnisse durchgehen** – meist mehrere Treffer
4. **Kapitel prüfen** – stimmt die Warenkategorie?
5. **Unterposition wählen** – Material, Funktion, Verwendung
6. **8-stellige Nummer notieren**

## Tipps

- Suchen Sie nach der **Funktion**, nicht nach dem Markennamen
- Prüfen Sie mehrere Treffer
- Beachten Sie Materialangaben (Kunststoff, Metall, Textil)

## Unsicher?

Bei Unsicherheit:
- **Zoll-Hotline** (0800 100 2010)
- **Verbindliche Zolltarifauskunft (vZTA)** beantragen (kostenlos, aber dauert)""",
        "applies_to": "ALL",
        "related_fields": ["warennummer", "ezt"],
        "topic_code": "warennummer",
    },
    # Dokumente
    {
        "title": "Welche Dokumente brauche ich?",
        "summary": "Für die Zollanmeldung benötigen Sie Rechnung, Versandnachweis und ggf. weitere Unterlagen.",
        "explanation": """## Pflichtdokumente

### 1. Rechnung

Die Rechnung muss enthalten:
- Absender (Name, Adresse)
- Empfänger (Name, Adresse)
- Warenbeschreibung
- Einzelpreise und Gesamtsumme
- Währung
- Rechnungsdatum

### 2. Versandnachweis

- Tracking-Nummer
- Frachtbrief oder Lieferschein
- Nachweis der Versandkosten

## Zusätzliche Dokumente

Je nach Ware können erforderlich sein:

| Dokument | Wann nötig? |
|----------|-------------|
| Ursprungszeugnis | Zollpräferenzen nutzen |
| CE-Kennzeichnung | Elektronik, Spielzeug |
| Gesundheitszeugnis | Lebensmittel, Kosmetik |
| CITES-Bescheinigung | Artenschutz |

## Tipp

Bewahren Sie alle Dokumente **mindestens 10 Jahre** auf. Der Zoll kann nachträglich prüfen.""",
        "applies_to": "ALL",
        "related_fields": ["rechnung", "dokumente", "absender", "empfaenger"],
        "topic_code": "dokumente",
    },
    {
        "title": "Was muss auf der Rechnung stehen?",
        "summary": "Die Rechnung muss Absender, Empfänger, Warenbeschreibung und Preise enthalten.",
        "explanation": """## Pflichtangaben

Eine zolltaugliche Rechnung enthält:

### Absender
- Vollständiger Name
- Adresse mit Land
- Bei Unternehmen: Firmenname

### Empfänger
- Vollständiger Name
- Adresse mit Land und PLZ

### Ware
- Genaue Beschreibung (nicht nur "Geschenk")
- Menge und Einheit
- Einzelpreise

### Summen
- Warenwert
- Versandkosten (idealerweise separat)
- Gesamtsumme
- Währung

### Datum
- Rechnungsdatum

## Häufige Probleme

| Problem | Lösung |
|---------|--------|
| "Gift" als Beschreibung | Genaue Warenart angeben |
| Keine Einzelpreise | Nachfordern beim Verkäufer |
| Fehlende Adresse | Ergänzen vor Anmeldung |

## Tipp

Fordern Sie **vor dem Kauf** eine detaillierte Rechnung an, wenn Sie wissen, dass der Wert über 150 € liegt.""",
        "applies_to": "ALL",
        "related_fields": ["rechnung", "warenbeschreibung", "warenwert"],
        "topic_code": "dokumente",
    },
    # Verfahren
    {
        "title": "Was ist die IZA?",
        "summary": "Die Internet-Zollanmeldung (IZA) ist das offizielle Webformular für Privatpersonen.",
        "explanation": """## Definition

**IZA** steht für **Internet-Zollanmeldung**. Es ist das offizielle Webformular des deutschen Zolls für Privatpersonen.

## Für wen?

Die IZA richtet sich an:
- Privatpersonen
- Einzelsendungen aus Nicht-EU-Ländern
- Warenwert über 150 € (oder unter 150 € mit zollpflichtigen Waren)

## Varianten

| Variante | Warenwert | Komplexität |
|----------|-----------|-------------|
| Vereinfacht | bis 1.000 € | Weniger Felder |
| Regulär | über 1.000 € | Alle Felder |

## Ablauf

1. Zoll-Portal aufrufen (zoll.de)
2. Sendungsdaten eingeben
3. Warennummer und Zollwert angeben
4. Anmeldung absenden
5. Bescheid erhalten
6. Abgaben zahlen

## Hinweis

ZollPilot bereitet Ihre Daten für die IZA vor. Die eigentliche Einreichung erfolgt durch Sie selbst im offiziellen Portal.""",
        "applies_to": "IZA",
        "related_fields": ["verfahren", "iza"],
        "topic_code": "verfahren",
    },
    {
        "title": "Welche Felder sind für Privatpersonen irrelevant?",
        "summary": "Viele Felder im Zollformular sind nur für gewerbliche Anmelder relevant.",
        "explanation": """## Übersicht

Das IZA-Formular enthält viele Felder, die für Privatpersonen **nicht relevant** sind:

## Irrelevante Felder

| Feld | Warum irrelevant? |
|------|-------------------|
| EORI-Nummer | Nur für gewerbliche Importeure |
| Incoterms | Nur bei Handelswaren |
| Zolllager | Nur für Unternehmen |
| Präferenznachweis | Nur für Unternehmen mit Handelsabkommen |
| Bewilligungsnummer | Nur für zugelassene Wirtschaftsbeteiligte |

## Relevante Felder für Privatpersonen

| Feld | Beschreibung |
|------|--------------|
| Absender | Name und Adresse des Versenders |
| Empfänger | Ihre Daten |
| Warenbeschreibung | Was ist in der Sendung? |
| Warenwert | Kaufpreis |
| Versandkosten | Internationale Transportkosten |
| Warennummer | 8-stellige Zolltarifnummer |

## Tipp

Lassen Sie irrelevante Felder leer oder wählen Sie "Nicht zutreffend", wenn angeboten.""",
        "applies_to": "IZA",
        "related_fields": ["eori", "formular", "felder"],
        "topic_code": "verfahren",
    },
    # Kosten
    {
        "title": "Wie wird die Einfuhrumsatzsteuer berechnet?",
        "summary": "Die EUSt wird auf Zollwert plus Zollbetrag berechnet, meist mit 19 %.",
        "explanation": """## Was ist die EUSt?

Die **Einfuhrumsatzsteuer (EUSt)** ist die Mehrwertsteuer auf importierte Waren. Sie entspricht der deutschen Umsatzsteuer.

## Steuersätze

| Satz | Gilt für |
|------|----------|
| 19 % | Die meisten Waren |
| 7 % | Bücher, Lebensmittel, bestimmte Güter |

## Berechnung

Die EUSt wird auf die **Bemessungsgrundlage** berechnet:

```
Bemessungsgrundlage = Zollwert + Zollbetrag
EUSt = Bemessungsgrundlage × 19 %
```

## Beispiel

| Position | Betrag |
|----------|--------|
| Zollwert | 225,00 € |
| Zoll (4,7 %) | 10,58 € |
| **Bemessungsgrundlage** | **235,58 €** |
| EUSt (19 %) | 44,76 € |
| **Gesamte Einfuhrabgaben** | **55,34 €** |

## Wichtig

- Die EUSt wird **immer** fällig, auch wenn der Zollsatz 0 % beträgt
- Ausnahme: Sendungen unter 1 € EUSt können befreit werden""",
        "applies_to": "ALL",
        "related_fields": ["eust", "einfuhrumsatzsteuer", "zollbetrag"],
        "topic_code": "kosten",
    },
    {
        "title": "Ab welchem Wert muss ich Zoll zahlen?",
        "summary": "Über 150 € Zollwert werden Zollgebühren fällig, über 22 € bereits Einfuhrumsatzsteuer.",
        "explanation": """## Wertgrenzen

Es gibt verschiedene Grenzen für Einfuhrabgaben:

### Bis 22 € Warenwert (seit 2021 abgeschafft für die meisten Sendungen)
- Früher: EUSt-frei
- Heute: EUSt fällt fast immer an (IOSS-Regelung)

### Bis 150 € Zollwert
- Keine Zollgebühren
- EUSt fällt an (19 % oder 7 %)

### Über 150 € Zollwert
- Zollgebühren je nach Warennummer
- EUSt zusätzlich

## Beispiele

| Zollwert | Zoll | EUSt | Gesamt |
|----------|------|------|--------|
| 100 € | 0 € | 19,00 € | 19,00 € |
| 200 € | 9,40 € (4,7 %) | 39,79 € | 49,19 € |

## Wichtig

- Der **Zollwert** ist maßgeblich, nicht der Kaufpreis
- Versandkosten werden eingerechnet
- Geschenke haben keine Sonderregelung mehr für Privatpersonen""",
        "applies_to": "ALL",
        "related_fields": ["warenwert", "zollwert", "freigrenze"],
        "topic_code": "kosten",
    },
]


async def seed_knowledge():
    """Fügt Knowledge Topics und Entries in die Datenbank ein."""
    db = Prisma()
    await db.connect()

    try:
        # 1. Topics erstellen
        topic_map = {}
        for topic in TOPICS:
            existing = await db.knowledgetopic.find_unique(where={"code": topic["code"]})

            if existing:
                print(f"⚠️  Topic existiert bereits: {topic['code']}")
                topic_map[topic["code"]] = existing.id
                continue

            created = await db.knowledgetopic.create(
                data={
                    "code": topic["code"],
                    "name": topic["name"],
                    "description": topic["description"],
                    "order_index": topic["order_index"],
                }
            )
            topic_map[topic["code"]] = created.id
            print(f"✅ Topic erstellt: {topic['name']}")

        # 2. Entries erstellen
        for entry in ENTRIES:
            # Prüfen ob Entry bereits existiert (nach Titel)
            existing = await db.knowledgeentry.find_first(
                where={"title": entry["title"]}
            )

            if existing:
                print(f"⚠️  Entry existiert bereits: {entry['title']}")
                continue

            topic_id = topic_map.get(entry.get("topic_code"))

            created = await db.knowledgeentry.create(
                data={
                    "title": entry["title"],
                    "summary": entry["summary"],
                    "explanation": entry["explanation"],
                    "applies_to": entry["applies_to"],
                    "related_fields": entry["related_fields"],
                    "status": "PUBLISHED",
                    "topic_id": topic_id,
                }
            )
            print(f"✅ Entry erstellt: {created.title}")

        print("\n🎉 Knowledge Base Seed abgeschlossen!")

    finally:
        await db.disconnect()


if __name__ == "__main__":
    import asyncio

    asyncio.run(seed_knowledge())
