# IPK v1 – Import-Paketverkehr

> **Sprint 9 – U8**: Erstes Verfahren für Kleinunternehmen

---

## Übersicht

| Eigenschaft | Wert |
|-------------|------|
| **Code** | IPK |
| **Version** | v1 |
| **Name** | Import-Paketverkehr |
| **Zielgruppe** | Kleinunternehmen |
| **Status** | Aktiv |

### Kurzbeschreibung

IPK ist für Kleinunternehmen gedacht, die regelmäßig Pakete aus dem Nicht-EU-Ausland importieren. Das Verfahren fokussiert auf die wesentlichen Angaben:
- Grunddaten (Sendungsnummer, Beschreibung, Gewicht)
- Warenwert (Rechnungsbetrag, Versandkosten)
- Herkunft (Ursprungsland, Lieferant)

---

## Wizard-Schritte

### Schritt 1: Grunddaten

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `sendungsnummer` | TEXT | Ja | Tracking-Nummer oder interne Referenz |
| `contents_description` | TEXT | Ja | Warenbeschreibung |
| `quantity` | NUMBER | Ja | Anzahl Packstücke (min: 1) |
| `weight_kg` | NUMBER | Ja | Bruttogewicht in kg (min: 0.01) |

### Schritt 2: Warenwert

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `value_amount` | NUMBER | Ja | Warenwert/Rechnungsbetrag (min: 0.01) |
| `value_currency` | CURRENCY | Ja | Währung des Betrags |
| `shipping_cost` | NUMBER | Nein | Versandkosten (optional) |
| `invoice_number` | TEXT | Nein | Rechnungsnummer (optional) |

### Schritt 3: Herkunft

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `origin_country` | COUNTRY | Ja | Herkunftsland der Ware |
| `sender_name` | TEXT | Ja | Name des Lieferanten |
| `sender_country` | COUNTRY | Ja | Land des Lieferanten |
| `sender_address` | TEXT | Nein | Adresse des Lieferanten (optional) |

---

## Validierungsregeln

### Geschäftsregeln

1. **Warenwert > 0**: Der Warenwert muss größer als 0 sein
2. **Herkunftsland ≠ DE**: Import muss aus dem Ausland kommen
3. **Absenderland ≠ DE**: Lieferant muss außerhalb Deutschlands sitzen
4. **Packstückanzahl ≥ 1**: Mindestens ein Packstück
5. **Gewicht > 0**: Gewicht muss positiv sein

### Fehlermeldungen

```python
# Herkunftsland ist Deutschland
"Das Herkunftsland darf nicht Deutschland sein – es handelt sich um eine Einfuhr."

# Absenderland ist Deutschland
"Der Lieferant muss außerhalb Deutschlands sitzen."

# Warenwert ≤ 0
"Der Warenwert muss größer als 0 sein."
```

---

## Formular-Mapping

### Grunddaten

| Feld | Zielformular | Zielfeld |
|------|--------------|----------|
| `sendungsnummer` | IPK – Grunddaten | Feld „Bezugsnummer" |
| `contents_description` | IPK – Grunddaten | Feld „Warenbezeichnung" |
| `quantity` | IPK – Grunddaten | Feld „Packstücke" |
| `weight_kg` | IPK – Grunddaten | Feld „Rohgewicht (kg)" |

### Warenwert

| Feld | Zielformular | Zielfeld |
|------|--------------|----------|
| `value_amount` | IPK – Warenwert | Feld „Rechnungsbetrag" |
| `value_currency` | IPK – Warenwert | Feld „Währung" |
| `shipping_cost` | IPK – Warenwert | Feld „Beförderungskosten" |
| `invoice_number` | IPK – Warenwert | Feld „Rechnungsnummer" |

### Herkunft

| Feld | Zielformular | Zielfeld |
|------|--------------|----------|
| `origin_country` | IPK – Herkunft | Feld „Ursprungsland" |
| `sender_name` | IPK – Herkunft | Feld „Versender/Ausführer" |
| `sender_country` | IPK – Herkunft | Feld „Versendungsland" |
| `sender_address` | IPK – Herkunft | Feld „Anschrift Versender" |

---

## Erklärtexte (Hints)

### Warenwert

**Was ist der Zollwert?**

> Der Zollwert basiert auf dem Transaktionswert (Kaufpreis) plus Transportkosten bis zur EU-Grenze.

Der CIF-Wert (Cost + Insurance + Freight) ist die Bemessungsgrundlage für Zölle und Einfuhrumsatzsteuer.

### Ursprungsland vs. Versendungsland

**Unterschied zwischen Ursprungsland und Versendungsland**

> Das Ursprungsland ist, wo die Ware hergestellt wurde. Das Versendungsland ist, woher sie verschickt wird.

Beispiel: Ein Produkt wird in China hergestellt, aber von einem Händler in Hongkong verschickt. Das Ursprungsland ist China, das Versendungsland ist Hongkong.

---

## Technische Details

### Config-Dateien

```
apps/web/src/procedures/IPK/v1/
├── meta.ts          # Verfahrens-Metadaten
├── steps.ts         # 3 Schritte, 11 Felder
├── mapping.ts       # 11 Feld-Mappings
├── hints.ts         # 4 Erklärtexte
└── index.ts         # Export
```

### Datenbank-Migration

```
prisma/migrations/0014_ipk_iaa_v1/migration.sql
```

---

## Einschränkungen (v1)

- Keine Sonderfälle (z.B. Zollpräferenzen)
- Kein Expertenmodus
- Keine automatische HS-Code-Ermittlung
- Keine Zollberechnung

Diese Features sind für spätere Versionen geplant.

---

## Siehe auch

- [OVERVIEW.md](./OVERVIEW.md) – Procedure System Übersicht
- [IAA.md](./IAA.md) – Internet-Ausfuhranmeldung
- [KNOWLEDGE_BASE.md](../KNOWLEDGE_BASE.md) – Wissensbasis
