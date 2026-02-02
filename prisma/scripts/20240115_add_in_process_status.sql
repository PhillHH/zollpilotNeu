-- Migration: Add IN_PROCESS status to CaseStatus enum
--
-- Diese Migration fügt den Status IN_PROCESS zum CaseStatus enum hinzu
-- und migriert bestehende Daten entsprechend.
--
-- Ausführen mit: psql -d <database> -f 20240115_add_in_process_status.sql
-- ODER über Prisma: npx prisma db push (nach Schema-Update)

-- ============================================================================
-- 1. Füge IN_PROCESS zum enum hinzu (falls nicht existiert)
-- ============================================================================

DO $$
BEGIN
    -- Prüfe ob der Wert bereits existiert
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'IN_PROCESS'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CaseStatus')
    ) THEN
        -- Füge den neuen Wert nach DRAFT ein
        ALTER TYPE "CaseStatus" ADD VALUE 'IN_PROCESS' AFTER 'DRAFT';
    END IF;
END
$$;

-- ============================================================================
-- 2. Migriere bestehende Daten
-- ============================================================================

-- Annahme 1: DRAFT-Fälle MIT gebundenem Verfahren → IN_PROCESS
-- Begründung: Wenn ein Verfahren gebunden ist, ist die Bearbeitung aktiv
UPDATE "Case"
SET status = 'IN_PROCESS'
WHERE status = 'DRAFT'
  AND procedure_id IS NOT NULL;

-- Annahme 2: DRAFT-Fälle OHNE Verfahren bleiben DRAFT
-- (Keine Änderung nötig)

-- Annahme 3: SUBMITTED und ARCHIVED bleiben unverändert
-- (Keine Änderung nötig)

-- ============================================================================
-- 3. Logging / Audit
-- ============================================================================

-- Erstelle temporäre Log-Tabelle für die Migration
CREATE TABLE IF NOT EXISTS "_migration_log" (
    id SERIAL PRIMARY KEY,
    migration_name TEXT NOT NULL,
    executed_at TIMESTAMP DEFAULT NOW(),
    details JSONB
);

-- Logge die Migration
INSERT INTO "_migration_log" (migration_name, details)
SELECT
    '20240115_add_in_process_status',
    jsonb_build_object(
        'cases_migrated_to_in_process', (
            SELECT COUNT(*) FROM "Case" WHERE status = 'IN_PROCESS'
        ),
        'cases_remaining_draft', (
            SELECT COUNT(*) FROM "Case" WHERE status = 'DRAFT'
        ),
        'cases_submitted', (
            SELECT COUNT(*) FROM "Case" WHERE status = 'SUBMITTED'
        ),
        'cases_archived', (
            SELECT COUNT(*) FROM "Case" WHERE status = 'ARCHIVED'
        )
    );

-- ============================================================================
-- Rollback (falls nötig - manuell ausführen)
-- ============================================================================

-- Um die Migration rückgängig zu machen:
--
-- 1. Setze alle IN_PROCESS zurück auf DRAFT:
--    UPDATE "Case" SET status = 'DRAFT' WHERE status = 'IN_PROCESS';
--
-- 2. Entferne den enum-Wert (nicht möglich in PostgreSQL ohne Neuerstellen)
--    Das Enum muss komplett neu erstellt werden, was aufwendiger ist.
--    Empfehlung: IN_PROCESS im Schema belassen, auch wenn nicht genutzt.
