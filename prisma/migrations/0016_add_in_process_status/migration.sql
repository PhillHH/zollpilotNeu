-- Add IN_PROCESS status to CaseStatus enum
-- This was missing from the initial migration

DO $$
BEGIN
    -- Check if the value already exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'IN_PROCESS'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CaseStatus')
    ) THEN
        -- Add the new value after DRAFT
        ALTER TYPE "CaseStatus" ADD VALUE 'IN_PROCESS' AFTER 'DRAFT';
    END IF;
END
$$;
