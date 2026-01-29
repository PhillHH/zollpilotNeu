-- Migration: User & Tenant Types + User Historie
-- Erweitert das Datenmodell um:
-- - UserType (PRIVATE / BUSINESS)
-- - TenantType (BUSINESS)
-- - UserStatus (ACTIVE / DISABLED)
-- - UserEvent (Historie für Registrierung, Login, etc.)
-- - last_login_at auf User

-- ============================================
-- 1. Neue Enums erstellen
-- ============================================

-- UserType: Unterscheidung Privat- vs. Unternehmensnutzer
CREATE TYPE "UserType" AS ENUM ('PRIVATE', 'BUSINESS');

-- UserStatus: Aktiv oder deaktiviert
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- TenantType: Aktuell nur BUSINESS (erweiterbar)
CREATE TYPE "TenantType" AS ENUM ('BUSINESS');

-- UserEventType: Arten von Nutzer-Ereignissen
CREATE TYPE "UserEventType" AS ENUM ('REGISTERED', 'LOGIN', 'LOGOUT', 'PASSWORD_RESET', 'STATUS_CHANGED');

-- ============================================
-- 2. User-Tabelle erweitern
-- ============================================

-- Neues Feld: user_type (Default: PRIVATE für bestehende Nutzer)
ALTER TABLE "User" ADD COLUMN "user_type" "UserType" NOT NULL DEFAULT 'PRIVATE';

-- Neues Feld: status (Default: ACTIVE für bestehende Nutzer)
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- Neues Feld: last_login_at (nullable)
ALTER TABLE "User" ADD COLUMN "last_login_at" TIMESTAMP(3);

-- ============================================
-- 3. Tenant-Tabelle erweitern
-- ============================================

-- Neues Feld: type (Default: BUSINESS für bestehende Mandanten)
ALTER TABLE "Tenant" ADD COLUMN "type" "TenantType" NOT NULL DEFAULT 'BUSINESS';

-- Index für type
CREATE INDEX "Tenant_type_idx" ON "Tenant"("type");

-- ============================================
-- 4. UserEvent-Tabelle erstellen
-- ============================================

CREATE TABLE "UserEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "UserEventType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata_json" JSONB,

    CONSTRAINT "UserEvent_pkey" PRIMARY KEY ("id")
);

-- Foreign Key zu User
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indizes für UserEvent
CREATE INDEX "UserEvent_user_id_idx" ON "UserEvent"("user_id");
CREATE INDEX "UserEvent_type_idx" ON "UserEvent"("type");
CREATE INDEX "UserEvent_created_at_idx" ON "UserEvent"("created_at");

-- ============================================
-- 5. Bestehende Daten migrieren
-- ============================================

-- Alle bestehenden User werden zu PRIVATE (Default bereits gesetzt)
-- Alle bestehenden Tenants werden zu BUSINESS (Default bereits gesetzt)

-- Optional: Initiale REGISTERED Events für bestehende User erstellen
INSERT INTO "UserEvent" ("id", "user_id", "type", "created_at", "metadata_json")
SELECT
    gen_random_uuid(),
    "id",
    'REGISTERED'::"UserEventType",
    "created_at",
    '{"migrated": true}'::jsonb
FROM "User";
