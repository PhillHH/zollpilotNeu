-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'NUMBER', 'SELECT', 'COUNTRY', 'CURRENCY', 'BOOLEAN');

-- AlterTable
ALTER TABLE "Case" ADD COLUMN "procedure_id" UUID;
ALTER TABLE "Case" ADD COLUMN "procedure_version" TEXT;

-- CreateTable
CREATE TABLE "Procedure" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedureStep" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "procedure_id" UUID NOT NULL,
    "step_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProcedureStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedureField" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "procedure_step_id" UUID NOT NULL,
    "field_key" TEXT NOT NULL,
    "field_type" "FieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "config_json" JSONB,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ProcedureField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Procedure_code_idx" ON "Procedure"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Procedure_code_version_key" ON "Procedure"("code", "version");

-- CreateIndex
CREATE INDEX "ProcedureStep_procedure_id_idx" ON "ProcedureStep"("procedure_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProcedureStep_procedure_id_step_key_key" ON "ProcedureStep"("procedure_id", "step_key");

-- CreateIndex
CREATE INDEX "ProcedureField_procedure_step_id_idx" ON "ProcedureField"("procedure_step_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProcedureField_procedure_step_id_field_key_key" ON "ProcedureField"("procedure_step_id", "field_key");

-- CreateIndex
CREATE INDEX "Case_procedure_id_idx" ON "Case"("procedure_id");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_procedure_id_fkey" FOREIGN KEY ("procedure_id") REFERENCES "Procedure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureStep" ADD CONSTRAINT "ProcedureStep_procedure_id_fkey" FOREIGN KEY ("procedure_id") REFERENCES "Procedure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureField" ADD CONSTRAINT "ProcedureField_procedure_step_id_fkey" FOREIGN KEY ("procedure_step_id") REFERENCES "ProcedureStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed IZA Procedure
DO $$
DECLARE
    proc_id UUID := gen_random_uuid();
    step_package_id UUID := gen_random_uuid();
    step_person_id UUID := gen_random_uuid();
BEGIN
    -- Create Procedure
    INSERT INTO "Procedure" ("id", "code", "name", "version", "is_active", "created_at", "updated_at")
    VALUES (proc_id, 'IZA', 'Zollanmeldung Import', 'v1', true, NOW(), NOW());

    -- Create Step 1: Package
    INSERT INTO "ProcedureStep" ("id", "procedure_id", "step_key", "title", "order", "is_active")
    VALUES (step_package_id, proc_id, 'package', 'Sendungsdaten', 1, true);

    -- Create Step 2: Person
    INSERT INTO "ProcedureStep" ("id", "procedure_id", "step_key", "title", "order", "is_active")
    VALUES (step_person_id, proc_id, 'person', 'Empfängerdaten', 2, true);

    -- Fields for Package Step
    INSERT INTO "ProcedureField" ("id", "procedure_step_id", "field_key", "field_type", "required", "config_json", "order")
    VALUES
        (gen_random_uuid(), step_package_id, 'tracking_number', 'TEXT', true, '{"placeholder": "z.B. 1Z999AA10123456784", "maxLength": 50}', 1),
        (gen_random_uuid(), step_package_id, 'weight_kg', 'NUMBER', true, '{"min": 0.01, "max": 1000, "step": 0.01}', 2),
        (gen_random_uuid(), step_package_id, 'origin_country', 'COUNTRY', true, '{"placeholder": "Herkunftsland"}', 3);

    -- Fields for Person Step
    INSERT INTO "ProcedureField" ("id", "procedure_step_id", "field_key", "field_type", "required", "config_json", "order")
    VALUES
        (gen_random_uuid(), step_person_id, 'recipient_name', 'TEXT', true, '{"placeholder": "Vor- und Nachname", "maxLength": 100}', 1),
        (gen_random_uuid(), step_person_id, 'recipient_address', 'TEXT', true, '{"placeholder": "Straße, Nr, PLZ, Ort", "maxLength": 200}', 2),
        (gen_random_uuid(), step_person_id, 'is_business', 'BOOLEAN', false, '{"label": "Geschäftliche Sendung"}', 3);
END $$;

