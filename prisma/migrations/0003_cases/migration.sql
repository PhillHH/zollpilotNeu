CREATE TYPE "CaseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ARCHIVED');

CREATE TABLE "Case" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "created_by_user_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "status" "CaseStatus" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Case_tenant_id_idx" ON "Case"("tenant_id");

ALTER TABLE "Case"
  ADD CONSTRAINT "Case_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Case_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

