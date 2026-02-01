-- Seed Content für ZollPilot
-- Blog-Artikel und FAQ-Einträge gemäß CONTENT_GUIDE.md und ARTICLE_SERIES_IZA.md

-- ============================================================================
-- BLOG-ARTIKEL (IZA-Serie)
-- ============================================================================

-- Artikel 1: Die 150-Euro-Falle
INSERT INTO "BlogPost" (id, title, slug, excerpt, content, status, published_at, created_at, updated_at, meta_title, meta_description)
VALUES (
  gen_random_uuid(),
  'IZA ab 150 Euro – Wann Privatpersonen verzollen müssen',
  'iza-150-euro-grenze-privatpersonen',
  'Erfahren Sie, ab welchem Warenwert eine Zollanmeldung (IZA) für Privatpersonen Pflicht ist und wie Sie typische Fehler bei der 150-Euro-Grenze vermeiden.',
  '# IZA ab 150 Euro – Wann Privatpersonen verzollen müssen

Sie haben ein Paket aus dem Ausland bestellt und fragen sich: **Muss ich jetzt eine Zollanmeldung machen?** Die Antwort hängt vom Warenwert ab. Ab 150 Euro greift die IZA-Pflicht für Privatpersonen.

## Die 150-Euro-Grenze: Was Sie wissen müssen

Seit dem 1. Juli 2021 gilt: **Sendungen mit einem Warenwert ab 150 Euro** erfordern eine Internet-Zollanmeldung (IZA). Darunter entfällt die Zollanmeldung, aber die Einfuhrumsatzsteuer wird trotzdem fällig.

### Wichtig: Zollwert ≠ Kaufpreis

Der Zollwert ist **nicht** nur der Kaufpreis! Er setzt sich zusammen aus:

- Warenwert (Kaufpreis)
- Versandkosten
- Versicherung (falls vorhanden)

**Beispiel:**
- Kaufpreis: 145 €
- Versand: 8 €
- **Zollwert: 153 €** → IZA-Pflicht!

Viele unterschätzen diese Regel und landen überraschend bei der Zollanmeldung.

## Typische Fehler bei der 150-Euro-Grenze

### Fehler 1: Versandkosten vergessen

Der häufigste Fehler: Sie rechnen nur mit dem Kaufpreis. Versandkosten werden übersehen – und plötzlich liegt der Zollwert über 150 Euro.

### Fehler 2: Währungsumrechnung falsch

Wenn Sie in USD, GBP oder einer anderen Währung bezahlt haben, muss der Betrag in Euro umgerechnet werden. Der Zoll nutzt dafür den **Referenzkurs der EZB** am Tag der Einfuhr.

### Fehler 3: Paketdienst übernimmt – teuer!

Viele Paketdienste bieten an, die Verzollung zu übernehmen. Das kostet oft **6–15 Euro Servicegebühr** – zusätzlich zu den Zollgebühren. Bei einer Sendung knapp über 150 Euro kann das unverhältnismäßig teuer werden.

## Was Sie vorbereiten müssen

Für die IZA benötigen Sie:

- **Rechnung** (mit Warenwert und Versandkosten)
- **Warennummer** (8-stellige Zolltarifnummer)
- **Sendungsnummer** (Tracking-Nummer)
- **Absender- und Empfängerdaten**

Die Warennummer finden Sie im **EZT Online** (Elektronischer Zolltarif). Mehr dazu in unserem Artikel: [Warennummer finden – EZT Online Anleitung](/blog/warennummern-ezt-online-anleitung).

## Wie ZollPilot dabei unterstützt

ZollPilot führt Sie durch alle notwendigen Fragen und erstellt eine **Ausfüllhilfe** für das IZA-Portal. Sie geben Ihre Daten ein, und wir bereiten alles vor – Sie tragen es dann selbst ins offizielle Formular ein.

**Wichtig:** ZollPilot übermittelt keine Daten an den Zoll. Die eigentliche Anmeldung führen Sie selbst durch.

## Fazit

Die 150-Euro-Grenze ist entscheidend. Denken Sie daran:
- Zollwert = Warenwert + Versand + Versicherung
- Währungsumrechnung beachten
- Paketdienst-Gebühren vermeiden durch Selbstverzollung

> ZollPilot bereitet Zollanmeldungen vor. Die eigentliche Anmeldung führen Sie selbst durch – zum Beispiel über das IZA-Portal des Zolls.',
  'PUBLISHED',
  NOW(),
  NOW(),
  NOW(),
  'IZA ab 150 Euro – Wann Privatpersonen verzollen müssen',
  'Erfahren Sie, ab welchem Warenwert eine Zollanmeldung (IZA) für Privatpersonen Pflicht ist und wie Sie typische Fehler bei der 150-Euro-Grenze vermeiden.'
);

-- Artikel 2: ATLAS und IZA erklärt
INSERT INTO "BlogPost" (id, title, slug, excerpt, content, status, published_at, created_at, updated_at, meta_title, meta_description)
VALUES (
  gen_random_uuid(),
  'ATLAS & IZA erklärt – So funktioniert das Zollsystem',
  'atlas-iza-zollsystem-erklaerung',
  'ATLAS ist das IT-System des deutschen Zolls, IZA das Internetformular. Erfahren Sie, wie beide zusammenhängen und warum die Zollanmeldung so komplex ist.',
  '# ATLAS & IZA erklärt – So funktioniert das Zollsystem

Wenn Sie sich mit Zollanmeldungen beschäftigen, stoßen Sie schnell auf zwei Begriffe: **ATLAS** und **IZA**. Was ist der Unterschied? Und warum ist das alles so kompliziert?

## Was ist ATLAS?

**ATLAS** steht für **Automatisiertes Tarif- und Lokales Zoll-Abwicklungs-System**. Es ist das zentrale IT-System der deutschen Zollverwaltung.

ATLAS wurde ursprünglich für **professionelle Zollagenten** entwickelt – nicht für Privatpersonen. Es ist komplex, umfangreich und erfordert Fachwissen.

### Warum ATLAS so komplex ist

- **Über 1.000 Datenfelder** für verschiedene Zollverfahren
- **Fachbegriffe** aus dem Zollrecht (z.B. „Bewilligungsinhaber\", „Verfahrenscode\")
- **Keine Fehlertoleranz**: Falsche Eingaben führen zu Ablehnungen

ATLAS ist nicht nutzerfreundlich – es ist ein Profi-Tool.

## Was ist IZA?

**IZA** steht für **Internet-Zollanmeldung**. Es ist ein **vereinfachtes Webformular** für Privatpersonen, das auf ATLAS aufbaut.

IZA wurde eingeführt, um Privatpersonen die Zollanmeldung zu ermöglichen – ohne ATLAS-Zugang oder Fachwissen.

### Was IZA kann

- **Einfachere Oberfläche** als ATLAS
- **Geführte Eingabe** für Standardfälle
- **Kostenlos** nutzbar (keine Lizenzgebühren)

### Was IZA nicht kann

- **Keine Speicherfunktion**: Eingaben gehen verloren, wenn Sie die Seite verlassen
- **Keine Vorlagen**: Jede Anmeldung muss neu eingegeben werden
- **Begrenzte Fehlerprüfung**: Falsche Warennummern werden oft nicht erkannt

## Warum ist die Zollanmeldung so kompliziert?

Das Zollsystem ist für **internationale Warenströme** ausgelegt – nicht für einzelne Pakete. Deshalb:

- **Viele Pflichtfelder**, die für Privatpersonen irrelevant sind
- **Fachbegriffe**, die nicht erklärt werden
- **Keine Hilfestellung** bei Warennummern oder Zollwert

IZA ist ein Schritt in die richtige Richtung, aber immer noch komplex.

## Stolpersteine im IZA-Portal

### 1. Warennummer finden

Die 8-stellige Zolltarifnummer ist Pflicht – aber wo finden Sie die? Im **EZT Online** (Elektronischer Zolltarif). Mehr dazu: [Warennummer finden – EZT Online Anleitung](/blog/warennummern-ezt-online-anleitung).

### 2. Zollwert berechnen

Der Zollwert ist **nicht** nur der Kaufpreis. Versandkosten und Versicherung müssen addiert werden. Mehr dazu: [Zollwert berechnen – Versandkosten richtig einkalkulieren](/blog/versandkosten-zollwert-rechenfehler).

### 3. Keine Speicherfunktion

IZA speichert Ihre Eingaben nicht. Wenn Sie die Seite verlassen, sind alle Daten weg.

## Wie ZollPilot dabei hilft

ZollPilot führt Sie durch alle Fragen und erstellt eine **Ausfüllhilfe**. Sie geben Ihre Daten ein, und wir bereiten alles vor – Sie tragen es dann ins IZA-Portal ein.

**Wichtig:** ZollPilot hat keine Schnittstelle zu ATLAS oder IZA. Die eigentliche Anmeldung führen Sie selbst durch.

## Fazit

- **ATLAS** = Profi-System für Zollagenten
- **IZA** = Vereinfachtes Webformular für Privatpersonen
- **Komplex** bleibt es trotzdem – aber machbar

> ZollPilot bereitet Zollanmeldungen vor. Die eigentliche Anmeldung führen Sie selbst durch.',
  'PUBLISHED',
  NOW(),
  NOW(),
  NOW(),
  'ATLAS & IZA erklärt – So funktioniert das Zollsystem',
  'ATLAS ist das IT-System des deutschen Zolls, IZA das Internetformular. Erfahren Sie, wie beide zusammenhängen und warum die Zollanmeldung so komplex ist.'
);

-- Artikel 3: Warennummern und EZT Online
INSERT INTO "BlogPost" (id, title, slug, excerpt, content, status, published_at, created_at, updated_at, meta_title, meta_description)
VALUES (
  gen_random_uuid(),
  'Warennummer finden – EZT Online Anleitung für Anfänger',
  'warennummern-ezt-online-anleitung',
  'Lernen Sie, wie Sie die richtige Zolltarifnummer im EZT Online finden. Schritt-für-Schritt-Anleitung mit typischen Fehlern und Praxistipps.',
  '# Warennummer finden – EZT Online Anleitung für Anfänger

Die **Warennummer** (auch Zolltarifnummer oder HS-Code genannt) ist ein Pflichtfeld in der Zollanmeldung. Aber wie finden Sie die richtige Nummer? Hier kommt **EZT Online** ins Spiel.

## Was ist eine Warennummer?

Die Warennummer ist eine **8-stellige Nummer**, die jede Warenart eindeutig identifiziert. Sie bestimmt:

- **Zollsatz** (wie viel Prozent Zoll fällig wird)
- **Einfuhrumsatzsteuer**
- **Verbote und Beschränkungen** (z.B. bei Lebensmitteln)

### Aufbau einer Warennummer

Beispiel: **8518 30 95**

- **85** = Kapitel (Elektrotechnik)
- **18** = Position (Lautsprecher, Kopfhörer)
- **30** = Unterposition (Kopfhörer)
- **95** = Untergliederung (andere als In-Ear)

Je genauer die Einordnung, desto präziser der Zollsatz.

## Typische Fehler bei der Einordnung

### Fehler 1: Zu allgemein

„Elektronik\" reicht nicht. Sie müssen die **genaue Warenart** kennen: Kopfhörer, Smartphone, Laptop, etc.

### Fehler 2: Falsche Kategorie

Ein Bluetooth-Lautsprecher ist **kein** Musikinstrument – auch wenn er Musik abspielt. Er gehört zu „Elektrotechnik\".

### Fehler 3: Veraltete Nummer

Zolltarifnummern ändern sich regelmäßig. Nutzen Sie immer die **aktuelle Version** im EZT Online.

## Schritt-für-Schritt-Anleitung: EZT Online

### Schritt 1: EZT Online öffnen

Gehen Sie auf: [https://www.zolltarifnummern.de](https://www.zolltarifnummern.de) (offizielles Portal der Zollverwaltung)

### Schritt 2: Suchbegriff eingeben

Geben Sie einen **beschreibenden Begriff** ein, z.B. „Bluetooth-Kopfhörer\".

### Schritt 3: Ergebnisse durchsuchen

Sie erhalten eine Liste möglicher Warennummern. Klicken Sie sich durch die Kategorien:

- **Kapitel 85**: Elektrotechnik
- **Position 8518**: Lautsprecher, Kopfhörer
- **Unterposition 851830**: Kopfhörer

### Schritt 4: Richtige Untergliederung wählen

Jetzt wird es spezifisch:
- **85183095**: Andere Kopfhörer (nicht In-Ear)
- **85183015**: In-Ear-Kopfhörer

Wählen Sie die passende Nummer.

### Schritt 5: Zollsatz prüfen

EZT Online zeigt Ihnen den **Zollsatz** an (z.B. 0% oder 2,2%). Notieren Sie die Nummer.

## Praxisbeispiel: Bluetooth-Kopfhörer

**Ware**: Bluetooth-Kopfhörer (Over-Ear)

1. **Suchbegriff**: „Bluetooth-Kopfhörer\"
2. **Kapitel**: 85 (Elektrotechnik)
3. **Position**: 8518 (Lautsprecher, Kopfhörer)
4. **Unterposition**: 851830 (Kopfhörer)
5. **Untergliederung**: 85183095 (andere Kopfhörer)

**Ergebnis**: Warennummer **8518 30 95**, Zollsatz 0%.

## Wie ZollPilot dabei hilft

ZollPilot fragt Sie nach der **Warenbeschreibung** und gibt Ihnen Hinweise zur Einordnung. Die endgültige Warennummer müssen Sie im EZT Online prüfen – wir bereiten die Suche vor.

**Wichtig:** Die Richtigkeit der Warennummer liegt in Ihrer Verantwortung. ZollPilot prüft die Plausibilität, aber nicht die inhaltliche Korrektheit.

## Fazit

- **EZT Online** ist das offizielle Tool für Warennummern
- **8-stellige Nummer** ist Pflicht
- **Genau einordnen** – zu allgemein führt zu Fehlern

> ZollPilot bereitet Zollanmeldungen vor. Die eigentliche Anmeldung führen Sie selbst durch.',
  'PUBLISHED',
  NOW(),
  NOW(),
  NOW(),
  'Warennummer finden – EZT Online Anleitung für Anfänger',
  'Lernen Sie, wie Sie die richtige Zolltarifnummer im EZT Online finden. Schritt-für-Schritt-Anleitung mit typischen Fehlern und Praxistipps.'
);

-- ============================================================================
-- FAQ-EINTRÄGE
-- ============================================================================

-- FAQ 1: Was ist ZollPilot?
INSERT INTO "FaqEntry" (id, question, answer, category, order_index, status, published_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Was ist ZollPilot?',
  '**ZollPilot ist ein Vorbereitungstool für Zollanmeldungen.**

Wir führen Sie durch alle notwendigen Fragen und erstellen eine Ausfüllhilfe für das offizielle IZA-Portal. Sie geben Ihre Daten ein, und wir bereiten alles vor – Sie tragen es dann selbst ins Formular ein.

**Was ZollPilot macht:**
- Geführte Fragen zu Ihrer Sendung
- Berechnung von Zollwert und Einfuhrumsatzsteuer
- Ausfüllhilfe als PDF

**Was ZollPilot nicht macht:**
- Keine Übermittlung an den Zoll
- Keine automatische Anmeldung
- Kein amtliches Formular

> ZollPilot bereitet vor. Die Anmeldung führen Sie selbst durch.',
  'Allgemein',
  1,
  'PUBLISHED',
  NOW(),
  NOW(),
  NOW()
);

-- FAQ 2: Führt ZollPilot die Anmeldung durch?
INSERT INTO "FaqEntry" (id, question, answer, category, order_index, status, published_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Führt ZollPilot die Zollanmeldung für mich durch?',
  '**Nein.** ZollPilot ist ein Vorbereitungstool.

Wir führen Sie durch alle notwendigen Fragen und erstellen eine Ausfüllhilfe. Die eigentliche Einreichung beim Zoll nehmen Sie selbst vor – zum Beispiel über das IZA-Portal.

**Warum nicht automatisch?**
- ZollPilot hat keine Schnittstelle zu ATLAS oder IZA
- Die Verantwortung für die Anmeldung liegt bei Ihnen
- Wir sind kein Zollagent oder Dienstleister

> ZollPilot bereitet vor. Die Anmeldung führen Sie selbst durch.',
  'Produkt',
  1,
  'PUBLISHED',
  NOW(),
  NOW(),
  NOW()
);

-- FAQ 3: Ist das PDF offiziell?
INSERT INTO "FaqEntry" (id, question, answer, category, order_index, status, published_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Ist das PDF von ZollPilot ein offizielles Formular?',
  '**Nein.** Das PDF ist eine **Ausfüllhilfe**, kein amtliches Formular.

Es enthält alle Daten, die Sie für die Zollanmeldung benötigen – übersichtlich aufbereitet. Sie tragen die Daten dann ins offizielle IZA-Portal ein.

**Das PDF enthält:**
- Warenwert und Zollwert
- Warennummer (Zolltarifnummer)
- Absender- und Empfängerdaten
- Berechnete Einfuhrumsatzsteuer

**Das PDF ist nicht:**
- Kein amtliches Formular
- Nicht rechtsgültig
- Nicht direkt beim Zoll einreichbar

> Die Richtigkeit der Daten liegt in Ihrer Verantwortung.',
  'Produkt',
  2,
  'PUBLISHED',
  NOW(),
  NOW(),
  NOW()
);

-- FAQ 4: Warum spare ich Geld?
INSERT INTO "FaqEntry" (id, question, answer, category, order_index, status, published_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Warum spare ich Geld mit ZollPilot?',
  '**Sie sparen die Servicegebühr des Paketdienstes.**

Viele Paketdienste (DHL, UPS, FedEx) bieten an, die Verzollung zu übernehmen. Das kostet oft **6–15 Euro** als „Auslagepauschale\" oder „Verzollungsservice\" – zusätzlich zu den Zollgebühren.

**Mit ZollPilot:**
- Sie bereiten die Anmeldung selbst vor
- Sie tragen die Daten ins IZA-Portal ein
- Die Servicegebühr entfällt

**Wichtig:** Die Zollgebühren selbst (Zoll und Einfuhrumsatzsteuer) bleiben gleich. Sie sparen nur die Dienstleister-Gebühr.

> ZollPilot bereitet vor. Die Anmeldung führen Sie selbst durch.',
  'Kosten',
  1,
  'PUBLISHED',
  NOW(),
  NOW(),
  NOW()
);

-- FAQ 5: Werden Daten übermittelt?
INSERT INTO "FaqEntry" (id, question, answer, category, order_index, status, published_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Werden meine Daten an den Zoll übermittelt?',
  '**Nein.** ZollPilot hat keine Schnittstelle zu Zollbehörden.

Ihre Daten bleiben bei Ihnen. Wir erstellen eine Ausfüllhilfe, die Sie selbst ins IZA-Portal eintragen.

**Datenspeicherung:**
- Ihre Fälle werden in Ihrem Account gespeichert
- Sie können sie jederzeit bearbeiten oder löschen
- Keine Übermittlung an Dritte

**Datenschutz:**
- DSGVO-konform
- Server in Deutschland
- Verschlüsselte Übertragung

> Die Richtigkeit der Daten liegt in Ihrer Verantwortung.',
  'Daten',
  1,
  'PUBLISHED',
  NOW(),
  NOW(),
  NOW()
);

-- FAQ 6: Für wen ist ZollPilot?
INSERT INTO "FaqEntry" (id, question, answer, category, order_index, status, published_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Für wen ist ZollPilot geeignet?',
  '**ZollPilot ist für Privatpersonen, die einzelne Sendungen verzollen.**

**Geeignet für:**
- Bestellungen aus dem Ausland (UK, USA, China, etc.)
- Geschenke und Rücksendungen
- Einzelne Pakete (nicht regelmäßig)

**Nicht geeignet für:**
- Gewerbliche Importe (regelmäßig, große Mengen)
- Komplexe Zollverfahren (z.B. Zolllager)
- Verbotene oder beschränkte Waren

**Verfahren:**
- IZA (Internet-Zollanmeldung)
- IPK (Import-Paketverkehr)
- IAA (Internet-Ausfuhranmeldung)

> ZollPilot bereitet vor. Die Anmeldung führen Sie selbst durch.',
  'Allgemein',
  2,
  'PUBLISHED',
  NOW(),
  NOW(),
  NOW()
);

-- FAQ 7: Muss ich Daten selbst eintragen?
INSERT INTO "FaqEntry" (id, question, answer, category, order_index, status, published_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Muss ich die Daten selbst ins IZA-Portal eintragen?',
  '**Ja.** ZollPilot erstellt eine Ausfüllhilfe – Sie tragen die Daten dann ins offizielle IZA-Portal ein.

**Warum?**
- ZollPilot hat keine Schnittstelle zu ATLAS oder IZA
- Die Verantwortung für die Anmeldung liegt bei Ihnen
- Copy & Paste aus dem PDF ins Portal

**Zeitaufwand:**
- Ca. 5–10 Minuten für das Eintragen
- Deutlich schneller als ohne Vorbereitung

> ZollPilot bereitet vor. Die Anmeldung führen Sie selbst durch.',
  'Produkt',
  3,
  'PUBLISHED',
  NOW(),
  NOW(),
  NOW()
);
