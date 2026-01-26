-- CreateEnum
CREATE TYPE "PlanInterval" AS ENUM ('ONE_TIME', 'YEARLY', 'MONTHLY', 'NONE');

-- CreateTable
CREATE TABLE "Plan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "price_cents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "interval" "PlanInterval" NOT NULL DEFAULT 'NONE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantCreditBalance" (
    "tenant_id" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantCreditBalance_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateTable
CREATE TABLE "CreditLedgerEntry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata_json" JSONB,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "plan_id" UUID;
ALTER TABLE "Tenant" ADD COLUMN "plan_activated_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE INDEX "CreditLedgerEntry_tenant_id_idx" ON "CreditLedgerEntry"("tenant_id");

-- CreateIndex
CREATE INDEX "CreditLedgerEntry_created_at_idx" ON "CreditLedgerEntry"("created_at");

-- CreateIndex
CREATE INDEX "Tenant_plan_id_idx" ON "Tenant"("plan_id");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantCreditBalance" ADD CONSTRAINT "TenantCreditBalance_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedgerEntry" ADD CONSTRAINT "CreditLedgerEntry_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedgerEntry" ADD CONSTRAINT "CreditLedgerEntry_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed FREE plan
INSERT INTO "Plan" ("id", "code", "name", "is_active", "price_cents", "currency", "interval", "created_at", "updated_at")
VALUES (gen_random_uuid(), 'FREE', 'Free Plan', true, 0, 'EUR', 'NONE', NOW(), NOW());

