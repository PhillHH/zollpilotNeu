-- Migration: Extend UserEventType enum
-- Adds new event types for activity tracking:
-- - PURCHASE: User made a purchase
-- - CREDIT_USED: Credits were used (e.g., PDF export)
-- - PLAN_CHANGED: Plan was changed

-- Add new values to UserEventType enum
ALTER TYPE "UserEventType" ADD VALUE IF NOT EXISTS 'PURCHASE';
ALTER TYPE "UserEventType" ADD VALUE IF NOT EXISTS 'CREDIT_USED';
ALTER TYPE "UserEventType" ADD VALUE IF NOT EXISTS 'PLAN_CHANGED';
