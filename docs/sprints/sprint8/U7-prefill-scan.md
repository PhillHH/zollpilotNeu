# Sprint 8 – U7: Scan & Vorbefüllen

> **Ziel:** Weniger Tipparbeit im Wizard durch Rechnungs-Upload und Feldvorschläge

---

## Umgesetzte Features

### A) Upload & Parsing (Backend)

**Neuer Endpunkt:** `POST /prefill/upload`

- Akzeptiert: PDF, JPG, PNG (max 10 MB)
- Verarbeitung nur im Arbeitsspeicher
- Keine permanente Speicherung

**Extraktion (v1, heuristisch):**
- Händlername (Regex: "von:", "Seller:", etc.)
- Gesamtbetrag (nahe "Gesamt", "Total", "Summe")
- Währung (€, $, £, CHF, EUR, USD, GBP)
- Versandkosten (nahe "Versand", "Shipping")
- Positionsliste (Zeilen mit Name + Preis)

**Rückgabe:**
- Vorschlagsobjekt mit Konfidenz-Score (0.0 - 1.0)
- Warnungen bei niedrigen Scores
- Erkannte Items/Positionen

### B) Vorschlagslogik

- **Kein Schreiben ohne Bestätigung**
- Feldweise Übernahme via Checkbox
- Unsichere Werte deutlich markiert (Badge: Hoch/Mittel/Niedrig)
- Warnung bei bereits ausgefüllten Feldern

### C) Frontend (Wizard)

**Neuer Abschnitt:** "Vorschläge aus Rechnung" (auf erstem Schritt)

- Upload-CTA mit Drag & Drop
- Modal mit Vorschlagsliste
- Checkboxen pro Feld
- "X Felder übernehmen" Button

**Hinweistext:**
> "Bitte prüfen – ZollPilot entscheidet nicht."

### D) Sicherheit & Datenschutz

- Uploads temporär (nur im Arbeitsspeicher)
- Keine Speicherung ohne explizite Zustimmung
- Kein Training mit Nutzerdaten
- Kein Logging von Dateiinhalten
- Keine externen Services

### E) Tests

**Backend (test_prefill.py):**
- Upload valid / invalid file type
- Leere Datei / zu große Datei
- Texterkennung aus PDF
- Bild-Fallback (unsupported warning)
- Unit-Tests für Extraktionsfunktionen

### F) Dokumentation

**Neu:**
- `docs/FEATURES/PREFILL.md` – Vollständige Feature-Dokumentation

**Updates:**
- `docs/ARCHITECTURE.md` – Prefill Layer Section
- `docs/WORDING_GUIDE.md` – Scan-Wording (erlaubt/verboten)
- `docs/API_CONTRACTS.md` – Prefill-Endpunkte

---

## Geänderte Dateien

### Backend

| Datei | Änderung |
|-------|----------|
| `apps/api/app/routes/prefill.py` | **NEU** – Prefill-Endpunkte |
| `apps/api/app/main.py` | Router hinzugefügt |
| `apps/api/tests/test_prefill.py` | **NEU** – Tests |

### Frontend

| Datei | Änderung |
|-------|----------|
| `apps/web/src/app/lib/api/client.ts` | Prefill-Types und API-Funktionen |
| `apps/web/src/app/app/cases/[id]/wizard/InvoicePrefill.tsx` | **NEU** – Prefill-Komponente |
| `apps/web/src/app/app/cases/[id]/wizard/WizardClient.tsx` | Integration, Modal, CTA |

### Dokumentation

| Datei | Änderung |
|-------|----------|
| `docs/FEATURES/PREFILL.md` | **NEU** |
| `docs/ARCHITECTURE.md` | Prefill Layer Section |
| `docs/WORDING_GUIDE.md` | Scan-Wording |
| `docs/API_CONTRACTS.md` | Prefill-Endpunkte |

---

## Nicht umgesetzt (bewusste Entscheidung v1)

| Feature | Grund |
|---------|-------|
| OCR für Bilder | Komplexität, externe Dependencies |
| KI/ML-Extraktion | Komplexität, Datenschutz |
| Automatische Übernahme | Nutzer-Kontrolle wichtiger |
| Mehrfach-Upload | Scope v1 |
| Vorlagen-Erkennung | Spätere Iteration |

---

## Summary

### What Users See

- Upload-Button auf erstem Wizard-Schritt
- Drag & Drop für Rechnungen
- Vorschlagsliste mit Konfidenz-Badges
- Feldweise Übernahme mit Checkboxen
- Klare Warnungen bei Unsicherheit

### Gaps / Notes

- Keine KI – bewusst heuristisch (v1)
- Bilder werden erkannt, aber nur mit Hinweis auf PDF-Upload
- Komplexe Layouts können zu ungenauen Ergebnissen führen
- Handgeschriebene Rechnungen nicht unterstützt

---

## Nächste Schritte (optional)

1. OCR-Integration (Tesseract oder Cloud mit Opt-in)
2. ML-basierte Extraktion für bessere Accuracy
3. Bekannte Händler-Vorlagen (Amazon, eBay, etc.)
4. Mehrfach-Upload für Sammelsendungen
