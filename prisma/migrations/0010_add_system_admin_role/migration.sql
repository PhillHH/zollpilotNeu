-- Add SYSTEM_ADMIN role to Role enum
-- This is the highest privilege role for ZollPilot internal system administrators

ALTER TYPE "Role" ADD VALUE 'SYSTEM_ADMIN' BEFORE 'OWNER';
