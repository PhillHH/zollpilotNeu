-- IPK v1 and IAA v1 Procedure Migration
-- Adds new procedures for import parcel traffic (IPK) and export declarations (IAA)

-- ============================================================================
-- IPK v1 - Import-Paketverkehr
-- ============================================================================

DO $$
DECLARE
    proc_id UUID := gen_random_uuid();
    step_grunddaten_id UUID := gen_random_uuid();
    step_warenwert_id UUID := gen_random_uuid();
    step_herkunft_id UUID := gen_random_uuid();
BEGIN
    -- Create IPK procedure
    INSERT INTO "Procedure" ("id", "code", "name", "version", "is_active", "created_at", "updated_at")
    VALUES (proc_id, 'IPK', 'Import-Paketverkehr', 'v1', true, NOW(), NOW());

    -- STEP 1: Grunddaten
    INSERT INTO "ProcedureStep" ("id", "procedure_id", "step_key", "title", "order", "is_active")
    VALUES (step_grunddaten_id, proc_id, 'grunddaten', 'Grunddaten', 1, true);

    INSERT INTO "ProcedureField" ("id", "procedure_step_id", "field_key", "field_type", "required", "config_json", "order")
    VALUES
        (gen_random_uuid(), step_grunddaten_id, 'sendungsnummer', 'TEXT', true,
         '{"title": "Sendungsnummer", "placeholder": "z.B. 1Z999AA10123456784", "description": "Tracking-Nummer oder interne Referenz", "maxLength": 50}', 1),
        (gen_random_uuid(), step_grunddaten_id, 'contents_description', 'TEXT', true,
         '{"title": "Warenbeschreibung", "placeholder": "z.B. Elektronikbauteile, Textilien...", "description": "Was enthält die Sendung?", "maxLength": 500}', 2),
        (gen_random_uuid(), step_grunddaten_id, 'quantity', 'NUMBER', true,
         '{"title": "Anzahl Packstücke", "placeholder": "1", "description": "Wie viele Packstücke umfasst die Sendung?", "min": 1, "step": 1}', 3),
        (gen_random_uuid(), step_grunddaten_id, 'weight_kg', 'NUMBER', true,
         '{"title": "Gewicht (kg)", "placeholder": "0.00", "description": "Bruttogewicht der Sendung in Kilogramm", "min": 0.01, "step": 0.01}', 4);

    -- STEP 2: Warenwert
    INSERT INTO "ProcedureStep" ("id", "procedure_id", "step_key", "title", "order", "is_active")
    VALUES (step_warenwert_id, proc_id, 'warenwert', 'Warenwert', 2, true);

    INSERT INTO "ProcedureField" ("id", "procedure_step_id", "field_key", "field_type", "required", "config_json", "order")
    VALUES
        (gen_random_uuid(), step_warenwert_id, 'value_amount', 'NUMBER', true,
         '{"title": "Warenwert", "placeholder": "0.00", "description": "Gesamtwert der Waren (Rechnungsbetrag)", "min": 0.01, "step": 0.01}', 1),
        (gen_random_uuid(), step_warenwert_id, 'value_currency', 'CURRENCY', true,
         '{"title": "Währung", "placeholder": "Währung wählen", "description": "Währung des Rechnungsbetrags"}', 2),
        (gen_random_uuid(), step_warenwert_id, 'shipping_cost', 'NUMBER', false,
         '{"title": "Versandkosten", "placeholder": "0.00", "description": "Kosten für Transport und Versicherung (optional)", "min": 0, "step": 0.01}', 3),
        (gen_random_uuid(), step_warenwert_id, 'invoice_number', 'TEXT', false,
         '{"title": "Rechnungsnummer", "placeholder": "z.B. INV-2026-001", "description": "Nummer der Handelsrechnung (falls vorhanden)", "maxLength": 50}', 4);

    -- STEP 3: Herkunft
    INSERT INTO "ProcedureStep" ("id", "procedure_id", "step_key", "title", "order", "is_active")
    VALUES (step_herkunft_id, proc_id, 'herkunft', 'Herkunft', 3, true);

    INSERT INTO "ProcedureField" ("id", "procedure_step_id", "field_key", "field_type", "required", "config_json", "order")
    VALUES
        (gen_random_uuid(), step_herkunft_id, 'origin_country', 'COUNTRY', true,
         '{"title": "Herkunftsland", "placeholder": "Land wählen", "description": "Land, in dem die Ware hergestellt wurde"}', 1),
        (gen_random_uuid(), step_herkunft_id, 'sender_name', 'TEXT', true,
         '{"title": "Lieferant / Absender", "placeholder": "Firmenname des Lieferanten", "description": "Name des Unternehmens, das die Ware versendet", "maxLength": 200}', 2),
        (gen_random_uuid(), step_herkunft_id, 'sender_country', 'COUNTRY', true,
         '{"title": "Land des Lieferanten", "placeholder": "Land wählen", "description": "Sitzland des Lieferanten"}', 3),
        (gen_random_uuid(), step_herkunft_id, 'sender_address', 'TEXT', false,
         '{"title": "Adresse des Lieferanten", "placeholder": "Straße, PLZ, Ort", "description": "Vollständige Adresse (optional)", "maxLength": 300}', 4);
END $$;


-- ============================================================================
-- IAA v1 - Internet-Ausfuhranmeldung
-- ============================================================================

DO $$
DECLARE
    proc_id UUID := gen_random_uuid();
    step_absender_id UUID := gen_random_uuid();
    step_empfaenger_id UUID := gen_random_uuid();
    step_geschaeftsart_id UUID := gen_random_uuid();
BEGIN
    -- Create IAA procedure
    INSERT INTO "Procedure" ("id", "code", "name", "version", "is_active", "created_at", "updated_at")
    VALUES (proc_id, 'IAA', 'Internet-Ausfuhranmeldung', 'v1', true, NOW(), NOW());

    -- STEP 1: Absender
    INSERT INTO "ProcedureStep" ("id", "procedure_id", "step_key", "title", "order", "is_active")
    VALUES (step_absender_id, proc_id, 'absender', 'Absender', 1, true);

    INSERT INTO "ProcedureField" ("id", "procedure_step_id", "field_key", "field_type", "required", "config_json", "order")
    VALUES
        (gen_random_uuid(), step_absender_id, 'sender_company', 'TEXT', true,
         '{"title": "Firmenname", "placeholder": "z.B. Musterfirma GmbH", "description": "Name Ihres Unternehmens", "maxLength": 200}', 1),
        (gen_random_uuid(), step_absender_id, 'sender_name', 'TEXT', true,
         '{"title": "Ansprechpartner", "placeholder": "Vor- und Nachname", "description": "Kontaktperson für Rückfragen", "maxLength": 100}', 2),
        (gen_random_uuid(), step_absender_id, 'sender_address', 'TEXT', true,
         '{"title": "Straße und Hausnummer", "placeholder": "z.B. Industriestraße 10", "maxLength": 200}', 3),
        (gen_random_uuid(), step_absender_id, 'sender_postcode', 'TEXT', true,
         '{"title": "Postleitzahl", "placeholder": "z.B. 12345", "maxLength": 10}', 4),
        (gen_random_uuid(), step_absender_id, 'sender_city', 'TEXT', true,
         '{"title": "Stadt", "placeholder": "z.B. Hamburg", "maxLength": 100}', 5),
        (gen_random_uuid(), step_absender_id, 'sender_country', 'COUNTRY', true,
         '{"title": "Land", "placeholder": "Land wählen", "description": "Standort des Unternehmens", "default": "DE"}', 6);

    -- STEP 2: Empfänger
    INSERT INTO "ProcedureStep" ("id", "procedure_id", "step_key", "title", "order", "is_active")
    VALUES (step_empfaenger_id, proc_id, 'empfaenger', 'Empfänger', 2, true);

    INSERT INTO "ProcedureField" ("id", "procedure_step_id", "field_key", "field_type", "required", "config_json", "order")
    VALUES
        (gen_random_uuid(), step_empfaenger_id, 'recipient_company', 'TEXT', false,
         '{"title": "Firmenname (optional)", "placeholder": "z.B. ABC Trading Co.", "description": "Falls der Empfänger ein Unternehmen ist", "maxLength": 200}', 1),
        (gen_random_uuid(), step_empfaenger_id, 'recipient_name', 'TEXT', true,
         '{"title": "Name des Empfängers", "placeholder": "Name oder Ansprechpartner", "maxLength": 200}', 2),
        (gen_random_uuid(), step_empfaenger_id, 'recipient_address', 'TEXT', true,
         '{"title": "Adresse", "placeholder": "Straße, Hausnummer, ggf. Zusatz", "maxLength": 300}', 3),
        (gen_random_uuid(), step_empfaenger_id, 'recipient_city', 'TEXT', true,
         '{"title": "Stadt / Ort", "placeholder": "z.B. New York", "maxLength": 100}', 4),
        (gen_random_uuid(), step_empfaenger_id, 'recipient_postcode', 'TEXT', false,
         '{"title": "Postleitzahl", "placeholder": "z.B. 10001", "description": "Falls im Zielland üblich", "maxLength": 20}', 5),
        (gen_random_uuid(), step_empfaenger_id, 'recipient_country', 'COUNTRY', true,
         '{"title": "Bestimmungsland", "placeholder": "Land wählen", "description": "Wohin wird die Ware exportiert?"}', 6);

    -- STEP 3: Geschäftsart
    INSERT INTO "ProcedureStep" ("id", "procedure_id", "step_key", "title", "order", "is_active")
    VALUES (step_geschaeftsart_id, proc_id, 'geschaeftsart', 'Geschäftsart', 3, true);

    INSERT INTO "ProcedureField" ("id", "procedure_step_id", "field_key", "field_type", "required", "config_json", "order")
    VALUES
        (gen_random_uuid(), step_geschaeftsart_id, 'export_type', 'SELECT', true,
         '{"title": "Art der Ausfuhr", "description": "Um welche Art von Export handelt es sich?", "options": ["Verkauf", "Muster", "Reparatur", "Rücksendung", "Sonstige"]}', 1),
        (gen_random_uuid(), step_geschaeftsart_id, 'contents_description', 'TEXT', true,
         '{"title": "Warenbeschreibung", "placeholder": "z.B. Maschinenbauteile, Elektronikartikel...", "description": "Genaue Beschreibung der Ausfuhrwaren", "maxLength": 500}', 2),
        (gen_random_uuid(), step_geschaeftsart_id, 'value_amount', 'NUMBER', true,
         '{"title": "Warenwert", "placeholder": "0.00", "description": "Wert der Ausfuhrwaren", "min": 0.01, "step": 0.01}', 3),
        (gen_random_uuid(), step_geschaeftsart_id, 'value_currency', 'CURRENCY', true,
         '{"title": "Währung", "placeholder": "Währung wählen", "description": "Währung des Warenwerts"}', 4),
        (gen_random_uuid(), step_geschaeftsart_id, 'weight_kg', 'NUMBER', true,
         '{"title": "Gewicht (kg)", "placeholder": "0.00", "description": "Bruttogewicht der Sendung", "min": 0.01, "step": 0.01}', 5),
        (gen_random_uuid(), step_geschaeftsart_id, 'remarks', 'TEXT', false,
         '{"title": "Bemerkungen", "placeholder": "Optionale Anmerkungen", "description": "Zusätzliche Informationen zur Ausfuhr", "maxLength": 1000}', 6);
END $$;
