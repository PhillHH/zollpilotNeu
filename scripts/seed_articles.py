"""
Seed-Skript für die IZA-Artikelserie (Sprint 6B – C4)

Fügt 5 Fachartikel zur Datenbank hinzu.
Ausführung: python -m scripts.seed_articles
"""

from datetime import datetime, timezone
from prisma import Prisma

# Artikel-Daten für die IZA-Serie
ARTICLES = [
    {
        "title": "Die 150-Euro-Falle: Wann die IZA für Privatpersonen Pflicht wird",
        "slug": "iza-150-euro-grenze-privatpersonen",
        "excerpt": "Warenwert über 150 Euro? Dann wird die Selbstverzollung zur Pflicht. Wir erklären, wann genau die IZA notwendig ist und welche Fehler Sie vermeiden sollten.",
        "meta_title": "IZA ab 150 Euro – Wann Privatpersonen verzollen müssen",
        "meta_description": "Erfahren Sie, ab welchem Warenwert eine Zollanmeldung (IZA) für Privatpersonen Pflicht ist und wie Sie typische Fehler bei der 150-Euro-Grenze vermeiden.",
        "content": """# Die 150-Euro-Falle: Wann die IZA für Privatpersonen Pflicht wird

Sie haben online bestellt – aus den USA, aus China oder einem anderen Land außerhalb der EU. Das Paket ist unterwegs. Und dann die Nachricht: Bitte zur Zollabfertigung.

Ab einem **Warenwert von 150 Euro** müssen Privatpersonen ihre Sendung selbst beim Zoll anmelden. Das ist die sogenannte **Internet-Zollanmeldung (IZA)**. Doch die Grenze ist tückischer, als sie klingt.

## Das Problem: Die 150 Euro sind nicht gleich 150 Euro

Viele denken: Meine Bestellung hat 149 Euro gekostet, also bin ich unter der Grenze. Falsch gedacht.

Der Zoll rechnet nicht mit dem Kaufpreis, sondern mit dem **Zollwert**. Und der setzt sich zusammen aus:

- Warenwert (Kaufpreis)
- Versandkosten (bis zur EU-Grenze)
- Versicherung (falls vorhanden)

Ein Beispiel: Sie kaufen ein Produkt für 140 Euro. Die Versandkosten betragen 15 Euro. Der Zollwert liegt bei **155 Euro** – Sie müssen eine IZA machen.

## Typische Fehler bei der 150-Euro-Grenze

### Fehler 1: Versandkosten ignorieren

Die meisten Onlineshops zeigen den Produktpreis und die Versandkosten getrennt an. Der Zoll addiert beides.

### Fehler 2: Währungsumrechnung unterschätzen

Bei Bestellungen in Dollar oder Pfund schwankt der Euro-Betrag. Der Zoll verwendet den Kurs am Tag der Anmeldung, nicht am Bestelltag.

### Fehler 3: Auf den Paketdienst verlassen

DHL, UPS und Co. bieten zwar Verzollungsservice an – oft für 6 bis 15 Euro extra. Aber das ist keine IZA, die Sie selbst machen. Der Dienstleister meldet für Sie an, Sie verlieren aber die Kontrolle über die Daten.

## Was Sie vorbereiten müssen

Für eine erfolgreiche IZA brauchen Sie:

1. **Rechnung** mit Warenbeschreibung und Einzelpreisen
2. **Versandnachweis** (Tracking, Lieferschein)
3. **Zolltarifnummer** (8 Stellen, aus dem EZT Online)
4. **Absender- und Empfängerdaten** (vollständig)

## Wie ZollPilot dabei unterstützt

ZollPilot führt Sie Schritt für Schritt durch alle notwendigen Angaben. Sie geben Ihre Daten ein, wir erstellen eine Ausfüllhilfe, die Sie für die offizielle Anmeldung verwenden können.

**Wichtig:** ZollPilot bereitet Ihre Zollanmeldung vor. Die eigentliche Einreichung beim Zoll führen Sie selbst durch – über das IZA-Portal oder bei der Zollstelle.

---

[Mit ZollPilot Ihre IZA vorbereiten →](/register)
""",
        "status": "PUBLISHED",
    },
    {
        "title": "ATLAS und IZA: Warum das Zollsystem so kompliziert ist",
        "slug": "atlas-iza-zollsystem-erklaerung",
        "excerpt": "Das Zoll-System heißt ATLAS, das Formular IZA. Wir erklären, was dahinter steckt, warum es so komplex ist – und wie Sie den Überblick behalten.",
        "meta_title": "ATLAS & IZA erklärt – So funktioniert das Zollsystem",
        "meta_description": "ATLAS ist das IT-System des deutschen Zolls, IZA das Internetformular. Erfahren Sie, wie beide zusammenhängen und warum die Zollanmeldung so komplex ist.",
        "content": """# ATLAS und IZA: Warum das Zollsystem so kompliziert ist

Wenn Sie zum ersten Mal eine Zollanmeldung machen, stoßen Sie schnell auf Abkürzungen: **ATLAS**, **IZA**, **EZT**, **EORI**. Das kann überwältigend wirken. In diesem Artikel erklären wir die wichtigsten Begriffe – ohne Behördendeutsch.

## Was ist ATLAS?

ATLAS steht für **Automatisiertes Tarif- und Lokales Zollabwicklungssystem**. Es ist das zentrale IT-System des deutschen Zolls, über das alle Ein- und Ausfuhren elektronisch abgewickelt werden.

Für Privatpersonen ist ATLAS nicht direkt zugänglich. Stattdessen gibt es vereinfachte Eingangspunkte wie das IZA-Portal.

## Was ist IZA?

IZA bedeutet **Internet-Zollanmeldung**. Es ist das offizielle Webformular für Privatpersonen, um Sendungen aus Nicht-EU-Ländern selbst zu verzollen.

Das IZA-Portal ist unter zoll.de erreichbar und bietet zwei Varianten:

- **Vereinfacht** (für Sendungen unter 1.000 Euro Warenwert)
- **Regulär** (für höhere Werte oder Spezialfälle)

## Warum ist das alles so kompliziert?

### Grund 1: Das System ist für Unternehmen gebaut

ATLAS wurde primär für Speditionen und Zollagenten entwickelt. Privatpersonen wurden erst später berücksichtigt – mit einem vereinfachten Portal, das aber trotzdem Fachbegriffe verwendet.

### Grund 2: Rechtliche Anforderungen

Eine Zollanmeldung ist ein amtliches Dokument. Fehler können zu Nachzahlungen oder sogar Strafen führen. Deshalb fragt der Zoll viele Details ab.

### Grund 3: Keine einheitliche Datenbasis

Lieferanten, Onlineshops und Paketdienste liefern unterschiedliche Informationen. Der Zoll braucht aber einheitliche Daten – das erzeugt Übersetzungsarbeit.

## Typische Stolpersteine im IZA-Portal

1. **Warennummer finden**: Die 8-stellige Zolltarifnummer ist Pflicht, aber nicht auf jeder Rechnung angegeben.
2. **Zollwert berechnen**: Warenwert + Versand + Versicherung – oft in Fremdwährung.
3. **Adressformat**: Das Portal akzeptiert keine freien Formate, alle Felder müssen einzeln ausgefüllt werden.

## Was Sie vorbereiten sollten

Bevor Sie ins IZA-Portal gehen:

- **Rechnung** mit Warenbeschreibung
- **Warennummer** aus dem EZT Online ermitteln
- **Versandkosten** separat notieren
- **Empfängerdaten** vollständig bereithalten

## Wie ZollPilot dabei unterstützt

ZollPilot übersetzt die Zoll-Logik in einfache Fragen. Sie beantworten Schritt für Schritt, wir erstellen eine Übersicht, die Sie ins offizielle Portal übertragen können.

**Hinweis:** ZollPilot ist kein offizielles Portal. Wir bereiten Ihre Daten vor – die Einreichung erfolgt durch Sie selbst.

---

[Mit ZollPilot starten →](/register)
""",
        "status": "PUBLISHED",
    },
    {
        "title": "Warennummern verstehen: EZT Online ohne Verzweiflung",
        "slug": "warennummern-ezt-online-anleitung",
        "excerpt": "Die Zolltarifnummer ist Pflicht bei jeder Anmeldung. Wir zeigen, wie Sie die richtige Nummer im EZT Online finden – auch ohne Vorkenntnisse.",
        "meta_title": "Warennummer finden – EZT Online Anleitung für Anfänger",
        "meta_description": "Lernen Sie, wie Sie die richtige Zolltarifnummer im EZT Online finden. Schritt-für-Schritt-Anleitung mit typischen Fehlern und Praxistipps.",
        "content": """# Warennummern verstehen: EZT Online ohne Verzweiflung

Jede Ware, die in die EU importiert wird, braucht eine **Warennummer** – auch Zolltarifnummer oder HS-Code genannt. Diese Nummer bestimmt, wie viel Zoll Sie zahlen müssen. Und genau hier beginnt für viele die Verwirrung.

## Was ist der EZT?

Der **EZT (Elektronischer Zolltarif)** ist die offizielle Datenbank des deutschen Zolls. Hier finden Sie alle Warennummern mit den zugehörigen Zollsätzen.

Die Datenbank ist öffentlich zugänglich unter: **eztonline.de**

## So ist eine Warennummer aufgebaut

Eine vollständige Warennummer hat **8 Stellen**:

```
8471 30 00
│    │  │
│    │  └── Unterposition (national)
│    └───── Unterposition (EU)
└────────── Kapitel + Position (international)
```

Die ersten 6 Stellen sind weltweit einheitlich (HS-Code). Die letzten 2 Stellen sind EU-spezifisch.

## Typische Fehler bei der Warennummer

### Fehler 1: Zu allgemein einordnen

Sie kaufen eine Smartwatch. Im EZT gibt es „Uhren", „Elektronik" und „tragbare Computer". Welche Kategorie ist richtig? Die Antwort hängt von der Hauptfunktion ab.

### Fehler 2: Beschreibung des Shops übernehmen

Onlineshops verwenden Marketingbegriffe. Der Zoll kennt nur technische Definitionen. Ein „Fitness-Tracker" kann je nach Funktion unter Uhren oder Messgeräte fallen.

### Fehler 3: Warennummer vom Lieferanten übernehmen

Manche Rechnungen enthalten bereits eine Warennummer. Diese kann aber für das Ursprungsland gelten oder veraltet sein.

## Schritt-für-Schritt: Warennummer im EZT finden

1. **EZT Online öffnen** (eztonline.de)
2. **Suchbegriff eingeben** (z. B. „Kopfhörer")
3. **Ergebnisse durchgehen** – meist mehrere Treffer
4. **Kapitel prüfen** – stimmt die Warenkategorie?
5. **Unterposition wählen** – Materialart, Funktion, Verwendung
6. **8-stellige Nummer notieren**

## Praxisbeispiel: Bluetooth-Kopfhörer

Suche: „Kopfhörer"

Mögliche Treffer:
- 8518 30 95 – Kopfhörer, kabellos
- 8518 30 90 – Kopfhörer, andere

Der Zollsatz für kabellose Kopfhörer liegt bei 0 %. Aber Achtung: Wenn die Kopfhörer Teil eines Sets sind, kann eine andere Nummer gelten.

## Was bei Unsicherheit tun?

Wenn Sie sich nicht sicher sind, welche Warennummer korrekt ist:

1. **Zoll-Hotline anrufen** (0800 100 2010)
2. **Verbindliche Zolltarifauskunft (vZTA) beantragen** – kostenlos, aber dauert
3. **Vorsichtig kalkulieren** – lieber etwas mehr Zoll einplanen

## Wie ZollPilot dabei unterstützt

ZollPilot fragt nach der Warenart und hilft Ihnen, die passende Kategorie zu finden. Die Daten werden strukturiert aufbereitet, sodass Sie sie direkt in die Zollanmeldung übertragen können.

**Hinweis:** Die endgültige Warennummer bestätigt der Zoll bei der Anmeldung. ZollPilot bereitet vor – Sie entscheiden.

---

[Jetzt Zollanmeldung vorbereiten →](/register)
""",
        "status": "PUBLISHED",
    },
    {
        "title": "Versandkosten und Zollwert: Die häufigsten Rechenfehler",
        "slug": "versandkosten-zollwert-rechenfehler",
        "excerpt": "Der Zollwert ist mehr als der Kaufpreis. Wir zeigen die häufigsten Fehler bei der Berechnung – und wie Sie sie vermeiden.",
        "meta_title": "Zollwert berechnen – Versandkosten richtig einkalkulieren",
        "meta_description": "Erfahren Sie, wie der Zollwert korrekt berechnet wird. Die häufigsten Fehler bei Versandkosten, Währungsumrechnung und Einfuhrumsatzsteuer.",
        "content": """# Versandkosten und Zollwert: Die häufigsten Rechenfehler

Viele unterschätzen den **Zollwert** – und zahlen am Ende mehr als erwartet. Oder sie machen Fehler bei der Berechnung und bekommen Probleme bei der Abfertigung. In diesem Artikel erklären wir, wie der Zollwert richtig ermittelt wird.

## Was ist der Zollwert?

Der Zollwert ist die Bemessungsgrundlage für:

1. **Zollgebühren** (variabler Prozentsatz je nach Ware)
2. **Einfuhrumsatzsteuer** (19 % oder 7 % auf Zollwert + Zoll)

Der Zollwert setzt sich zusammen aus:

```
Zollwert = Warenwert + Versandkosten + Versicherung
```

Alle Kosten **bis zur EU-Außengrenze** werden addiert.

## Typische Rechenfehler

### Fehler 1: Versandkosten vergessen

Sie kaufen ein Produkt für 145 Euro, die Versandkosten betragen 12 Euro. Der Zollwert liegt bei **157 Euro** – über der 150-Euro-Grenze.

Viele rechnen nur mit dem Warenwert und wundern sich, warum eine IZA nötig ist.

### Fehler 2: Inlandsversand einrechnen

Wenn der Shop die Ware erst zu einem Versandlager schickt und von dort international versendet, zählt nur der **internationale Anteil** der Versandkosten.

### Fehler 3: Währungsumrechnung am falschen Tag

Der Zoll verwendet den **Kurs am Tag der Anmeldung**, nicht am Bestelltag. Bei schwankenden Währungen (Dollar, Pfund) kann das mehrere Euro Unterschied machen.

### Fehler 4: Einfuhrumsatzsteuer als Zollwert verwenden

Die Einfuhrumsatzsteuer (EUSt) wird **nach** dem Zoll berechnet:

```
EUSt = (Zollwert + Zollbetrag) × 19 %
```

Der Zollwert allein ist also niedriger als die Gesamtkosten.

## Beispielrechnung

| Position | Betrag |
|----------|--------|
| Warenwert | 200,00 € |
| Versandkosten (international) | 25,00 € |
| **Zollwert** | **225,00 €** |
| Zoll (z. B. 4,7 %) | 10,58 € |
| **Bemessungsgrundlage EUSt** | **235,58 €** |
| EUSt (19 %) | 44,76 € |
| **Gesamtkosten Einfuhr** | **55,34 €** |

## Was Sie dokumentieren sollten

Für eine korrekte Zollanmeldung brauchen Sie:

- **Rechnung** mit Einzelpreisen und Gesamtsumme
- **Versandkostennachweis** (separat aufgeschlüsselt)
- **Zahlungsnachweis** (PayPal, Kreditkarte, Überweisung)
- **Tracking-Nummer** als Liefernachweis

## Sonderfälle

### Geschenke

Auch Geschenke haben einen Zollwert. Der Absender muss den Wert auf der Zollinhaltserklärung angeben.

### Rücksendungen / Reparaturen

Wenn Sie eine eigene Ware zur Reparatur ins Ausland geschickt haben, kann der Zollwert auf den Reparaturwert begrenzt werden – mit Nachweis.

### Muster ohne Handelswert

Kostenlose Muster sind nicht automatisch zollfrei. Der Zoll kann einen Schätzwert ansetzen.

## Wie ZollPilot dabei unterstützt

ZollPilot fragt alle relevanten Kosten ab und berechnet den Zollwert automatisch. Sie sehen vorab, welche Abgaben voraussichtlich anfallen.

**Hinweis:** Die finale Berechnung erfolgt durch den Zoll. ZollPilot liefert eine Schätzung auf Basis Ihrer Angaben.

---

[Zollwert berechnen mit ZollPilot →](/register)
""",
        "status": "PUBLISHED",
    },
    {
        "title": "IZA selbst machen oder Dienstleister beauftragen?",
        "slug": "iza-selbst-machen-oder-dienstleister",
        "excerpt": "Selbstverzollung oder Paketdienst? Wir vergleichen Aufwand, Kosten und Risiken – damit Sie die richtige Entscheidung treffen.",
        "meta_title": "IZA selbst oder Dienstleister – Was lohnt sich?",
        "meta_description": "Vergleich: Zollanmeldung selbst machen vs. Paketdienst beauftragen. Kosten, Zeitaufwand und Risiken im Überblick.",
        "content": """# IZA selbst machen oder Dienstleister beauftragen?

Wenn Ihr Paket beim Zoll liegt, haben Sie zwei Optionen: **Selbst anmelden** oder **den Paketdienst beauftragen**. Beide Wege haben Vor- und Nachteile. Wir helfen Ihnen bei der Entscheidung.

## Option 1: Paketdienst verzollt

DHL, UPS, FedEx und andere Paketdienste bieten einen Verzollungsservice an. Das funktioniert so:

1. Der Paketdienst meldet die Ware beim Zoll an
2. Sie zahlen Zoll, EUSt und eine Servicegebühr
3. Das Paket wird zugestellt

### Vorteile

- Kein eigener Aufwand
- Schnelle Abwicklung (oft 1–2 Tage)
- Keine Registrierung im Zollportal nötig

### Nachteile

- **Servicegebühr**: Meist 6 bis 15 Euro, manchmal mehr
- **Keine Kontrolle**: Der Paketdienst wählt Warennummer und Zollwert
- **Fehlerrisiko**: Falsche Angaben können zu Nachzahlungen führen
- **Intransparenz**: Sie sehen nicht, was genau angemeldet wurde

## Option 2: Selbst anmelden (IZA)

Bei der Selbstverzollung melden Sie die Ware direkt beim Zoll an – über das IZA-Portal oder bei einer Zollstelle.

### Vorteile

- **Keine Servicegebühr**: Sie zahlen nur Zoll und EUSt
- **Volle Kontrolle**: Sie prüfen alle Angaben selbst
- **Transparenz**: Sie wissen genau, was angemeldet wurde
- **Lerneffekt**: Für zukünftige Bestellungen vorbereitet

### Nachteile

- **Zeitaufwand**: Erste Anmeldung dauert 30–60 Minuten
- **Lernkurve**: Fachbegriffe und Abläufe müssen verstanden werden
- **Verantwortung**: Fehler liegen bei Ihnen

## Wann lohnt sich was?

| Situation | Empfehlung |
|-----------|------------|
| Erste Bestellung, niedriger Wert | Paketdienst (Lernaufwand vs. Ersparnis) |
| Regelmäßige Bestellungen | Selbst (Ersparnis summiert sich) |
| Hoher Warenwert | Selbst (mehr Kontrolle, Fehler teurer) |
| Zeitdruck | Paketdienst (schneller) |
| Unklare Rechnung | Selbst (Sie kennen die Details) |

## Kostenvergleich: Beispielrechnung

| Position | Paketdienst | Selbst |
|----------|-------------|--------|
| Warenwert | 200 € | 200 € |
| Zoll (4,7 %) | 9,40 € | 9,40 € |
| EUSt (19 %) | 39,79 € | 39,79 € |
| Servicegebühr | 12,00 € | – |
| **Gesamt Einfuhrabgaben** | **61,19 €** | **49,19 €** |
| Ersparnis | – | **12,00 €** |

Bei 5 Bestellungen im Jahr: **60 Euro Ersparnis**.

## Typische Fehler vermeiden

### Bei Paketdienst

- Prüfen Sie die Abrechnung auf Plausibilität
- Reklamieren Sie falsche Warennummern
- Bewahren Sie Belege auf

### Bei Selbstanmeldung

- Alle Dokumente vorab bereithalten
- Zollwert korrekt berechnen (inkl. Versand)
- Warennummer sorgfältig ermitteln

## Wie ZollPilot dabei unterstützt

ZollPilot bereitet Ihre Daten für die Selbstanmeldung vor. Sie beantworten einfache Fragen, wir erstellen eine Übersicht, die Sie ins IZA-Portal übertragen können.

So sparen Sie die Servicegebühr – und behalten die Kontrolle.

**Hinweis:** ZollPilot führt keine Zollanmeldung durch. Die Einreichung erfolgt durch Sie selbst.

---

[Jetzt mit ZollPilot vorbereiten →](/register)
""",
        "status": "PUBLISHED",
    },
]


async def seed_articles():
    """Fügt die IZA-Artikelserie in die Datenbank ein."""
    db = Prisma()
    await db.connect()

    try:
        for article in ARTICLES:
            # Prüfen, ob Artikel bereits existiert
            existing = await db.blogpost.find_unique(where={"slug": article["slug"]})

            if existing:
                print(f"⚠️  Artikel existiert bereits: {article['slug']}")
                continue

            # Artikel erstellen
            created = await db.blogpost.create(
                data={
                    "title": article["title"],
                    "slug": article["slug"],
                    "excerpt": article["excerpt"],
                    "content": article["content"],
                    "status": article["status"],
                    "meta_title": article["meta_title"],
                    "meta_description": article["meta_description"],
                    "published_at": datetime.now(timezone.utc)
                    if article["status"] == "PUBLISHED"
                    else None,
                }
            )
            print(f"✅ Artikel erstellt: {created.title}")

        print("\n🎉 Seed abgeschlossen!")

    finally:
        await db.disconnect()


if __name__ == "__main__":
    import asyncio

    asyncio.run(seed_articles())
