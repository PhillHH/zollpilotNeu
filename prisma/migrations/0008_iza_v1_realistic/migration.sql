-- IZA v1 Realistic Procedure Migration
-- Updates existing IZA v1 with production-ready structure

-- First, delete old IZA steps and fields (cascade will handle fields)
DELETE FROM "ProcedureStep" WHERE "procedure_id" IN (
    SELECT "id" FROM "Procedure" WHERE "code" = 'IZA' AND "version" = 'v1'
);

-- Update existing IZA procedure
UPDATE "Procedure" 
SET "name" = 'Internetbestellung – Import Zollanmeldung',
    "updated_at" = NOW()
WHERE "code" = 'IZA' AND "version" = 'v1';

-- Add new steps and fields to existing IZA procedure
DO $$
DECLARE
    proc_id UUID;
    step_package_id UUID := gen_random_uuid();
    step_sender_id UUID := gen_random_uuid();
    step_recipient_id UUID := gen_random_uuid();
    step_additional_id UUID := gen_random_uuid();
BEGIN
    -- Get existing procedure ID
    SELECT "id"::UUID INTO proc_id FROM "Procedure" WHERE "code" = 'IZA' AND "version" = 'v1';

    -- STEP 1: Package
    INSERT INTO "ProcedureStep" ("id", "procedure_id", "step_key", "title", "order", "is_active")
    VALUES (step_package_id, proc_id, 'package', 'Über dein Paket', 1, true);

    INSERT INTO "ProcedureField" ("id", "procedure_step_id", "field_key", "field_type", "required", "config_json", "order")
    VALUES
        (gen_random_uuid(), step_package_id, 'contents_description', 'TEXT', true, 
         '{"title": "Inhaltsbeschreibung", "placeholder": "z.B. Elektronik, Kleidung, Bücher...", "description": "Was ist in deinem Paket?", "maxLength": 500}', 1),
        (gen_random_uuid(), step_package_id, 'value_amount', 'NUMBER', true,
         '{"title": "Warenwert", "placeholder": "0.00", "description": "Gesamtwert der Ware (ohne Versandkosten)", "min": 0.01, "step": 0.01}', 2),
        (gen_random_uuid(), step_package_id, 'value_currency', 'CURRENCY', true,
         '{"title": "Währung", "placeholder": "Währung wählen", "description": "In welcher Währung wurde bezahlt?"}', 3),
        (gen_random_uuid(), step_package_id, 'origin_country', 'COUNTRY', true,
         '{"title": "Herkunftsland", "placeholder": "Land wählen", "description": "Aus welchem Land wird das Paket versendet?"}', 4);

    -- STEP 2: Sender
    INSERT INTO "ProcedureStep" ("id", "procedure_id", "step_key", "title", "order", "is_active")
    VALUES (step_sender_id, proc_id, 'sender', 'Absender', 2, true);

    INSERT INTO "ProcedureField" ("id", "procedure_step_id", "field_key", "field_type", "required", "config_json", "order")
    VALUES
        (gen_random_uuid(), step_sender_id, 'sender_name', 'TEXT', true,
         '{"title": "Name des Absenders", "placeholder": "z.B. AliExpress oder Firmenname", "description": "Wer hat das Paket versendet?", "maxLength": 200}', 1),
        (gen_random_uuid(), step_sender_id, 'sender_country', 'COUNTRY', true,
         '{"title": "Land des Absenders", "placeholder": "Land wählen", "description": "In welchem Land sitzt der Absender?"}', 2);

    -- STEP 3: Recipient
    INSERT INTO "ProcedureStep" ("id", "procedure_id", "step_key", "title", "order", "is_active")
    VALUES (step_recipient_id, proc_id, 'recipient', 'Empfänger', 3, true);

    INSERT INTO "ProcedureField" ("id", "procedure_step_id", "field_key", "field_type", "required", "config_json", "order")
    VALUES
        (gen_random_uuid(), step_recipient_id, 'recipient_full_name', 'TEXT', true,
         '{"title": "Vollständiger Name", "placeholder": "Vor- und Nachname", "description": "An wen ist das Paket adressiert?", "maxLength": 200}', 1),
        (gen_random_uuid(), step_recipient_id, 'recipient_address', 'TEXT', true,
         '{"title": "Straße und Hausnummer", "placeholder": "z.B. Musterstraße 123", "maxLength": 200}', 2),
        (gen_random_uuid(), step_recipient_id, 'recipient_postcode', 'TEXT', true,
         '{"title": "Postleitzahl", "placeholder": "z.B. 12345", "maxLength": 10}', 3),
        (gen_random_uuid(), step_recipient_id, 'recipient_city', 'TEXT', true,
         '{"title": "Stadt", "placeholder": "z.B. Berlin", "maxLength": 100}', 4),
        (gen_random_uuid(), step_recipient_id, 'recipient_country', 'COUNTRY', true,
         '{"title": "Land", "placeholder": "Land wählen", "description": "Wohin soll geliefert werden?", "default": "DE"}', 5);

    -- STEP 4: Additional Info
    INSERT INTO "ProcedureStep" ("id", "procedure_id", "step_key", "title", "order", "is_active")
    VALUES (step_additional_id, proc_id, 'additional', 'Weitere Angaben', 4, true);

    INSERT INTO "ProcedureField" ("id", "procedure_step_id", "field_key", "field_type", "required", "config_json", "order")
    VALUES
        (gen_random_uuid(), step_additional_id, 'commercial_goods', 'BOOLEAN', true,
         '{"label": "Gewerbliche Einfuhr", "description": "Handelt es sich um gewerbliche Ware (zum Weiterverkauf)?"}', 1),
        (gen_random_uuid(), step_additional_id, 'remarks', 'TEXT', false,
         '{"title": "Bemerkungen", "placeholder": "Optionale Anmerkungen für den Zoll", "description": "Zusätzliche Informationen (z.B. Geschenksendung, Muster)", "maxLength": 1000}', 2);
END $$;
