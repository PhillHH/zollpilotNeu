-- Case Lifecycle & Versioning Migration

-- Add version and submitted_at to Case
ALTER TABLE "Case" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Case" ADD COLUMN "submitted_at" TIMESTAMP(3);

-- Create CaseSnapshot table
CREATE TABLE "CaseSnapshot" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "procedure_code" TEXT NOT NULL,
    "procedure_version" TEXT NOT NULL,
    "fields_json" JSONB NOT NULL,
    "validation_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseSnapshot_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on case_id + version
CREATE UNIQUE INDEX "CaseSnapshot_case_id_version_key" ON "CaseSnapshot"("case_id", "version");

-- Create index on case_id
CREATE INDEX "CaseSnapshot_case_id_idx" ON "CaseSnapshot"("case_id");

-- Add foreign key constraint
ALTER TABLE "CaseSnapshot" ADD CONSTRAINT "CaseSnapshot_case_id_fkey" 
    FOREIGN KEY ("case_id") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

