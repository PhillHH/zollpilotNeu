# IAA v1 – Internet-Ausfuhranmeldung

> **Sprint 9 – U8**: Erstes Export-Verfahren für Kleinunternehmen

---

## Übersicht

| Eigenschaft | Wert |
|-------------|------|
| **Code** | IAA |
| **Version** | v1 |
| **Name** | Internet-Ausfuhranmeldung |
| **Zielgruppe** | Kleinunternehmen |
| **Status** | Aktiv |

### Kurzbeschreibung

IAA ist für Kleinunternehmen gedacht, die Waren aus Deutschland in Nicht-EU-Länder exportieren. Das Verfahren fokussiert auf:
- Absender (Ausführer in Deutschland)
- Empfänger (im Ausland)
- Geschäftsart (Art des Exports, Warenwert)

---

## Wizard-Schritte

### Schritt 1: Absender

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `sender_company` | TEXT | Ja | Firmenname des Ausführers |
| `sender_name` | TEXT | Ja | Ansprechpartner |
| `sender_address` | TEXT | Ja | Straße und Hausnummer |
| `sender_postcode` | TEXT | Ja | Postleitzahl |
| `sender_city` | TEXT | Ja | Stadt |
| `sender_country` | COUNTRY | Ja | Land (Standard: DE) |

### Schritt 2: Empfänger

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `recipient_company` | TEXT | Nein | Firmenname des Empfängers (optional) |
| `recipient_name` | TEXT | Ja | Name des Empfängers |
| `recipient_address` | TEXT | Ja | Adresse |
| `recipient_city` | TEXT | Ja | Stadt / Ort |
| `recipient_postcode` | TEXT | Nein | Postleitzahl (falls üblich) |
| `recipient_country` | COUNTRY | Ja | Bestimmungsland (außerhalb EU) |

### Schritt 3: Geschäftsart

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `export_type` | SELECT | Ja | Art der Ausfuhr |
| `contents_description` | TEXT | Ja | Warenbeschreibung |
| `value_amount` | NUMBER | Ja | Warenwert (min: 0.01) |
| `value_currency` | CURRENCY | Ja | Währung |
| `weight_kg` | NUMBER | Ja | Bruttogewicht in kg |
| `remarks` | TEXT | Nein | Bemerkungen (optional) |

#### Ausfuhrarten (export_type)

| Wert | Beschreibung |
|------|--------------|
| Verkauf | Endgültiger Verkauf an Käufer im Ausland |
| Muster | Kostenlose Muster zu Werbezwecken |
| Reparatur | Vorübergehende Ausfuhr zur Reparatur |
| Rücksendung | Rückgabe an ursprünglichen Lieferanten |
| Sonstige | Andere Gründe (z.B. Geschenk, Leihgabe) |

---

## Validierungsregeln

### Geschäftsregeln

1. **Absenderland = DE**: Ausfuhr muss aus Deutschland erfolgen
2. **Empfängerland ≠ DE**: Export muss ins Ausland gehen
3. **Warenwert > 0**: Der Warenwert muss größer als 0 sein
4. **Gewicht > 0**: Gewicht muss positiv sein
5. **Gültige Geschäftsart**: Muss eine der erlaubten Optionen sein

### Fehlermeldungen

```python
# Absenderland ist nicht Deutschland
"Bei einer Ausfuhr aus Deutschland muss das Absenderland Deutschland sein."

# Empfängerland ist Deutschland
"Das Bestimmungsland darf nicht Deutschland sein – es handelt sich um eine Ausfuhr."

# Ungültige Geschäftsart
"Bitte wählen Sie eine gültige Geschäftsart: Verkauf, Muster, Reparatur, Rücksendung, Sonstige."
```

---

## Formular-Mapping

### Absender (Ausführer)

| Feld | Zielformular | Zielfeld |
|------|--------------|----------|
| `sender_company` | IAA – Ausführer | Feld „Name/Firma" |
| `sender_name` | IAA – Ausführer | Feld „Ansprechpartner" |
| `sender_address` | IAA – Ausführer | Feld „Straße/Hausnummer" |
| `sender_postcode` | IAA – Ausführer | Feld „PLZ" |
| `sender_city` | IAA – Ausführer | Feld „Ort" |
| `sender_country` | IAA – Ausführer | Feld „Land" |

### Empfänger

| Feld | Zielformular | Zielfeld |
|------|--------------|----------|
| `recipient_company` | IAA – Empfänger | Feld „Name/Firma" |
| `recipient_name` | IAA – Empfänger | Feld „Ansprechpartner" |
| `recipient_address` | IAA – Empfänger | Feld „Anschrift" |
| `recipient_city` | IAA – Empfänger | Feld „Ort" |
| `recipient_postcode` | IAA – Empfänger | Feld „PLZ" |
| `recipient_country` | IAA – Empfänger | Feld „Land" |

### Geschäftsart

| Feld | Zielformular | Zielfeld |
|------|--------------|----------|
| `export_type` | IAA – Geschäftsart | Feld „Geschäftsart" |
| `contents_description` | IAA – Geschäftsart | Feld „Warenbezeichnung" |
| `value_amount` | IAA – Geschäftsart | Feld „Statistischer Wert" |
| `value_currency` | IAA – Geschäftsart | Feld „Währung" |
| `weight_kg` | IAA – Geschäftsart | Feld „Rohmasse (kg)" |
| `remarks` | IAA – Geschäftsart | Feld „Bemerkungen" |

---

## Erklärtexte (Hints)

### Geschäftsart

**Welche Geschäftsart wähle ich?**

> Die Geschäftsart beschreibt den Grund für den Export und beeinflusst die zollrechtliche Behandlung.

- **Verkauf**: Endgültiger Verkauf
- **Muster**: Kostenlose Muster
- **Reparatur**: Vorübergehende Ausfuhr
- **Rücksendung**: Rückgabe an Lieferanten
- **Sonstige**: Andere Gründe

### Bestimmungsland

**Wohin darf ich exportieren?**

> Für die IAA-Anmeldung muss das Bestimmungsland außerhalb der EU liegen.

Für Lieferungen innerhalb der EU benötigen Sie keine Ausfuhranmeldung. Beachten Sie mögliche Exportbeschränkungen für bestimmte Länder (Embargos) oder Warenarten (Dual-Use-Güter).

### Absenderland

**Warum muss der Absender in Deutschland sein?**

> Die Internet-Ausfuhranmeldung ist für Ausfuhren aus Deutschland vorgesehen.

Das IAA-Verfahren wird bei deutschen Zollbehörden durchgeführt. Der Ausführer muss in Deutschland ansässig sein.

---

## Technische Details

### Config-Dateien

```
apps/web/src/procedures/IAA/v1/
├── meta.ts          # Verfahrens-Metadaten
├── steps.ts         # 3 Schritte, 16 Felder
├── mapping.ts       # 16 Feld-Mappings
├── hints.ts         # 4 Erklärtexte
└── index.ts         # Export
```

### Datenbank-Migration

```
prisma/migrations/0014_ipk_iaa_v1/migration.sql
```

---

## Einschränkungen (v1)

- Keine Dual-Use-Prüfung
- Keine Embargo-Länder-Warnung
- Keine automatische Warennummer-Ermittlung
- Kein Expertenmodus

Diese Features sind für spätere Versionen geplant.

---

## Siehe auch

- [OVERVIEW.md](./OVERVIEW.md) – Procedure System Übersicht
- [IPK.md](./IPK.md) – Import-Paketverkehr
- [KNOWLEDGE_BASE.md](../KNOWLEDGE_BASE.md) – Wissensbasis
