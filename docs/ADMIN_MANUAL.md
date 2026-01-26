# Admin-Handbuch

Dieses Dokument beschreibt die administrativen Funktionen in ZollPilot.

---

## Voraussetzungen

- Sie benötigen die Rolle ADMIN oder OWNER
- Zugriff auf den Admin-Bereich unter `/admin`

---

## Übersicht

Der Admin-Bereich bietet folgende Funktionen:

| Bereich | Funktion |
|---------|----------|
| **Mandanten** | Organisationen verwalten, Tarife zuweisen, Guthaben vergeben |
| **Tarife** | Abonnement-Pläne erstellen und verwalten |

---

## Mandanten verwalten

### Mandantenübersicht

1. Navigieren Sie zu `/admin/tenants`
2. Die Tabelle zeigt:
   - **Mandant**: Name der Organisation
   - **Tarif**: Zugewiesener Plan (Badge)
   - **Guthaben**: Aktueller Credit-Stand
   - **Erstellt am**: Registrierungsdatum
3. Klicken Sie auf "Verwalten", um Details zu öffnen

### Tarif zuweisen

1. Öffnen Sie die Mandanten-Detailseite
2. Im Bereich "Tarif":
   - Wählen Sie einen aktiven Tarif aus der Dropdown-Liste
   - Klicken Sie auf "Tarif speichern"
3. Der neue Tarif ist sofort aktiv

### Guthaben vergeben

1. Öffnen Sie die Mandanten-Detailseite
2. Im Bereich "Guthaben":
   - Geben Sie den Betrag ein (positive Zahl)
   - Optional: Fügen Sie einen Hinweis hinzu (z.B. "Willkommensbonus")
   - Klicken Sie auf "Guthaben vergeben"
3. Das Guthaben wird sofort gutgeschrieben
4. Eine Erfolgsmeldung erscheint: "Guthaben erfolgreich vergeben"

### Guthaben-Historie einsehen

Die Tabelle "Guthaben-Historie" zeigt die letzten 50 Bewegungen:

| Spalte | Beschreibung |
|--------|--------------|
| Datum | Zeitpunkt der Buchung |
| Änderung | +/- Betrag (farbcodiert) |
| Grund | Art der Buchung (Badge) |
| Hinweis | Optionaler Kommentar |

**Buchungsgründe:**

| Grund | Bedeutung |
|-------|-----------|
| Admin-Vergabe | Manuell durch Admin vergeben |
| Tarif-Bonus | Automatisch durch Tarifwechsel |
| PDF-Export | Verbrauch durch PDF-Download |
| Erstattung | Manuelle Gutschrift |

---

## Tarife verwalten

### Tarifübersicht

1. Navigieren Sie zu `/admin/plans`
2. Die Tabelle zeigt alle Tarife mit:
   - **Code**: Eindeutiger Bezeichner
   - **Name**: Anzeigename
   - **Intervall**: Abrechnungszeitraum
   - **Preis**: Preis in EUR
   - **Status**: Aktiv oder Inaktiv

### Neuen Tarif erstellen

1. Klicken Sie auf "Neuen Tarif erstellen"
2. Füllen Sie das Formular aus:
   - **Code**: Großbuchstaben (z.B. `BASIC`, `PREMIUM`)
   - **Name**: Anzeigename (z.B. "Basis-Tarif")
   - **Intervall**: Keine / Monatlich / Jährlich / Einmalig
   - **Preis**: In Cent (z.B. 999 = 9,99 €)
3. Klicken Sie auf "Tarif erstellen"

### Tarif aktivieren/deaktivieren

- **Aktivieren**: Tarif wird für Zuweisung verfügbar
- **Deaktivieren**: Tarif kann nicht mehr zugewiesen werden
  - Bestehende Zuweisungen bleiben erhalten

---

## Häufige Aufgaben

### Ersteinrichtung

1. Registrieren Sie den ersten Benutzer (wird automatisch OWNER)
2. Gehen Sie zu `/admin/plans`
3. Der FREE-Tarif ist bereits vorhanden
4. Erstellen Sie weitere Tarife nach Bedarf
5. Weisen Sie Ihrem Mandanten einen Tarif zu

### Testguthaben vergeben

1. Gehen Sie zu `/admin/tenants`
2. Finden Sie den Mandanten
3. Klicken Sie auf "Verwalten"
4. Vergeben Sie Credits mit Hinweis "Testzugang"

### Niedriger Guthabenstand

Wenn ein Benutzer keine PDFs herunterladen kann:

1. Prüfen Sie den Guthabenstand
2. Prüfen Sie die Historie auf ungewöhnliche Muster
3. Vergeben Sie ggf. Credits mit Hinweis

---

## Guthabenverbrauch

### PDF-Export

Bei jedem PDF-Download:
- **1 Credit wird abgezogen**
- Buchung mit Grund `PDF_EXPORT`
- Metadaten: Fall-ID und Version

### Empfohlene Preisgestaltung

| Aktion | Empfohlene Credits |
|--------|-------------------|
| PDF-Export | 1 Credit |
| Zukünftig: Priorität | 5 Credits |
| Zukünftig: Speicher | 2 Credits/Monat |

---

## UI-Übersicht

### Farbcodes in der Oberfläche

| Element | Bedeutung |
|---------|-----------|
| 🟢 Grüner Text | Positive Änderung (+Credits) |
| 🔴 Roter Text | Negative Änderung (-Credits) |
| Aktiv-Badge | Tarif ist verfügbar |
| Inaktiv-Badge | Tarif ist deaktiviert |

### Feedback-Meldungen

- **Grüner Banner**: Aktion erfolgreich
- **Roter Banner**: Fehler aufgetreten
- Meldungen verschwinden nach 3 Sekunden automatisch

---

## API-Referenz

Detaillierte Endpunkt-Dokumentation: `docs/API_CONTRACTS.md`

| Endpunkt | Beschreibung |
|----------|--------------|
| `GET /admin/plans` | Tarife auflisten |
| `POST /admin/plans` | Tarif erstellen |
| `PATCH /admin/plans/{id}` | Tarif bearbeiten |
| `POST /admin/plans/{id}/activate` | Aktivieren |
| `POST /admin/plans/{id}/deactivate` | Deaktivieren |
| `GET /admin/tenants` | Mandanten auflisten |
| `POST /admin/tenants/{id}/plan` | Tarif zuweisen |
| `POST /admin/tenants/{id}/credits/grant` | Guthaben vergeben |
| `GET /admin/tenants/{id}/credits/ledger` | Historie abrufen |

---

*Letzte Aktualisierung: Sprint 2 (Design System v1)*
