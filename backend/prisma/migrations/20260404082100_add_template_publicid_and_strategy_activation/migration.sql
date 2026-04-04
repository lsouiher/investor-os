-- AlterEnum: Add strategy_activation to PromptServiceType
ALTER TYPE "PromptServiceType" ADD VALUE 'strategy_activation';

-- Step 1: Add public_id column as nullable
ALTER TABLE "prompt_templates" ADD COLUMN "public_id" TEXT;

-- Step 2: Backfill existing rows with unique CUID2-style IDs
-- Using gen_random_uuid() as a fallback since we can't call Node CUID2 from SQL
UPDATE "prompt_templates" SET "public_id" = replace(gen_random_uuid()::text, '-', '') WHERE "public_id" IS NULL;

-- Step 3: Make the column NOT NULL
ALTER TABLE "prompt_templates" ALTER COLUMN "public_id" SET NOT NULL;

-- Step 4: Add unique constraint
CREATE UNIQUE INDEX "prompt_templates_public_id_key" ON "prompt_templates"("public_id");
