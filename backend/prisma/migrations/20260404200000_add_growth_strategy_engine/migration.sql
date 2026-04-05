-- Growth Strategy Engine migration
-- Note: ALTER TYPE ADD VALUE is non-transactional in PostgreSQL
-- These must come before CREATE TABLE statements that reference the new enum values

-- Extend PromptServiceType enum
ALTER TYPE "PromptServiceType" ADD VALUE 'growth_path_generation';
ALTER TYPE "PromptServiceType" ADD VALUE 'cross_path_analysis';

-- New enums
CREATE TYPE "GrowthPathType" AS ENUM ('portfolio', 'income_capital', 'skills_knowledge', 'time_operations');
CREATE TYPE "GrowthPathStatus" AS ENUM ('locked', 'unlocked', 'generating', 'generated');
CREATE TYPE "GrowthStrategyStatus" AS ENUM ('active', 'superseded');
CREATE TYPE "UnlockType" AS ENUM ('organic', 'manual', 'system');
CREATE TYPE "ExportType" AS ENUM ('markdown', 'pdf');

-- Add feature_flags column to tenants
ALTER TABLE "tenants" ADD COLUMN "feature_flags" JSONB NOT NULL DEFAULT '{}';

-- Create growth_strategies table
CREATE TABLE "growth_strategies" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "identity_version_id" INTEGER NOT NULL,
    "status" "GrowthStrategyStatus" NOT NULL DEFAULT 'active',
    "overall_progress" INTEGER NOT NULL DEFAULT 0,
    "growth_score" INTEGER NOT NULL DEFAULT 0,
    "cross_path_links" JSONB NOT NULL DEFAULT '[]',
    "next_best_action" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_strategies_pkey" PRIMARY KEY ("id")
);

-- Create growth_paths table
CREATE TABLE "growth_paths" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "growth_strategy_id" INTEGER NOT NULL,
    "path_type" "GrowthPathType" NOT NULL,
    "status" "GrowthPathStatus" NOT NULL DEFAULT 'locked',
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "strategy_id" INTEGER,
    "content" JSONB NOT NULL DEFAULT '{}',
    "action_items" JSONB NOT NULL DEFAULT '[]',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "unlock_type" "UnlockType",
    "unlocked_at" TIMESTAMP(3),
    "unlock_trigger" JSONB,
    "generated_at" TIMESTAMP(3),
    "generation_cooldown_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_paths_pkey" PRIMARY KEY ("id")
);

-- Create export_history table
CREATE TABLE "export_history" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "export_type" "ExportType" NOT NULL,
    "identity_version" INTEGER NOT NULL,
    "path_versions" JSONB NOT NULL,
    "paths_included" JSONB NOT NULL,
    "consent_given" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_history_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "growth_strategies_public_id_key" ON "growth_strategies"("public_id");
CREATE UNIQUE INDEX "growth_paths_public_id_key" ON "growth_paths"("public_id");
CREATE UNIQUE INDEX "growth_paths_tenant_id_growth_strategy_id_path_type_version_key" ON "growth_paths"("tenant_id", "growth_strategy_id", "path_type", "version");
CREATE UNIQUE INDEX "export_history_public_id_key" ON "export_history"("public_id");

-- Prevent duplicate active strategies per user (TOCTOU race guard)
CREATE UNIQUE INDEX "growth_strategies_one_active_per_user" ON "growth_strategies"("user_id", "tenant_id") WHERE "status" = 'active';

-- Prevent duplicate current paths per (strategy, path_type)
CREATE UNIQUE INDEX "growth_paths_one_current_per_type" ON "growth_paths"("tenant_id", "growth_strategy_id", "path_type") WHERE "is_current" = true;

-- Indexes for growth_strategies
CREATE INDEX "growth_strategies_tenant_id_idx" ON "growth_strategies"("tenant_id");
CREATE INDEX "growth_strategies_tenant_id_user_id_idx" ON "growth_strategies"("tenant_id", "user_id");
CREATE INDEX "growth_strategies_tenant_id_user_id_status_idx" ON "growth_strategies"("tenant_id", "user_id", "status");

-- Indexes for growth_paths
CREATE INDEX "growth_paths_tenant_id_idx" ON "growth_paths"("tenant_id");
CREATE INDEX "growth_paths_tenant_id_growth_strategy_id_idx" ON "growth_paths"("tenant_id", "growth_strategy_id");
CREATE INDEX "growth_paths_tenant_id_user_id_idx" ON "growth_paths"("tenant_id", "user_id");

-- Indexes for export_history
CREATE INDEX "export_history_tenant_id_idx" ON "export_history"("tenant_id");
CREATE INDEX "export_history_tenant_id_user_id_idx" ON "export_history"("tenant_id", "user_id");
CREATE INDEX "export_history_tenant_id_user_id_export_type_created_at_idx" ON "export_history"("tenant_id", "user_id", "export_type", "created_at");

-- Foreign keys
ALTER TABLE "growth_strategies" ADD CONSTRAINT "growth_strategies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "growth_strategies" ADD CONSTRAINT "growth_strategies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "growth_strategies" ADD CONSTRAINT "growth_strategies_identity_version_id_fkey" FOREIGN KEY ("identity_version_id") REFERENCES "identity_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "growth_paths" ADD CONSTRAINT "growth_paths_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "growth_paths" ADD CONSTRAINT "growth_paths_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "growth_paths" ADD CONSTRAINT "growth_paths_growth_strategy_id_fkey" FOREIGN KEY ("growth_strategy_id") REFERENCES "growth_strategies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "growth_paths" ADD CONSTRAINT "growth_paths_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "export_history" ADD CONSTRAINT "export_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "export_history" ADD CONSTRAINT "export_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Row-Level Security policies for new tables
ALTER TABLE "growth_strategies" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "growth_strategies"
  USING ("tenant_id" = current_setting('app.current_tenant_id')::int);

ALTER TABLE "growth_paths" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "growth_paths"
  USING ("tenant_id" = current_setting('app.current_tenant_id')::int);

ALTER TABLE "export_history" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "export_history"
  USING ("tenant_id" = current_setting('app.current_tenant_id')::int);
