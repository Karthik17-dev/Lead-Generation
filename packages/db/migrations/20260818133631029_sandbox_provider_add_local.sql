-- Migration: sandbox_provider_add_local
--
-- SAFETY HEADER (house rules -- see packages/db/MIGRATIONS.md#zero-downtime-rules).
-- Tune these down further for large/hot tables; raise statement_timeout only
-- for an operation you've deliberately reasoned about (e.g. a NOT VALID
-- constraint's later VALIDATE, or a batched backfill with its own paging).
set lock_timeout = '2s';
set statement_timeout = '30s';

-- Add 'local' to the sandbox_provider enum — the SAME-MACHINE dev provider
-- (apps/api/src/platform/providers/local.ts), used exclusively behind
-- ZED_LOCAL_DEV=1 / ALLOWED_SANDBOX_PROVIDERS=local. The value lives in the
-- Drizzle schema (packages/db/src/schema/zed.ts) so fresh databases already
-- have it; this migration carries it onto every OTHER database.
--
-- Precedent: sandbox_provider 'platinum' (20260708154500000) and 'managed'
-- before it. ADD VALUE only (never USED in this txn) — Postgres forbids using
-- a freshly-added enum value in the same transaction that added it, so a
-- session actually pinning provider='local' happens in a later transaction
-- (it always does — this migration only ever runs standalone).
-- Non-destructive + idempotent.
--
-- enum-value-checked: no baseline (real or faked) can already have this exact
-- value. The original baseline (20260621094136410_baseline.sql) created the
-- enum with 'daytona' only ('platinum'/'managed' came later, also by ADD VALUE),
-- and the local-docker removal (20260807165721291) REBUILT the type as
-- ('daytona','platinum','e2b') — a CREATE TYPE that overwrites faked baselines
-- too, so any environment, including one that faked past the baseline, is
-- provably missing 'local' until this migration runs. There is no skip case:
-- grep packages/db/src for an existing 'local' member shows none, and the type
-- cannot gain members outside the migration chain (drizzle push is forbidden).
ALTER TYPE "zed"."sandbox_provider" ADD VALUE IF NOT EXISTS 'local';