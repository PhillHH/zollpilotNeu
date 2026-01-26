-- AlterTable
ALTER TABLE "Case" ADD COLUMN "archived_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CaseField" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value_json" JSONB NOT NULL,
    "value_text" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CaseField_case_id_idx" ON "CaseField"("case_id");

-- CreateIndex
CREATE INDEX "CaseField_key_idx" ON "CaseField"("key");

-- CreateIndex
CREATE UNIQUE INDEX "CaseField_case_id_key_key" ON "CaseField"("case_id", "key");

-- AddForeignKey
ALTER TABLE "CaseField" ADD CONSTRAINT "CaseField_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

