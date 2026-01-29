-- Sprint 4 B1: Extend Plan model with credits and procedures
-- CreateEnum
CREATE TYPE "ProcedureCode" AS ENUM ('IZA', 'IAA', 'IPK');

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN "credits_included" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Plan" ADD COLUMN "allowed_procedures" "ProcedureCode"[] DEFAULT ARRAY[]::"ProcedureCode"[];
