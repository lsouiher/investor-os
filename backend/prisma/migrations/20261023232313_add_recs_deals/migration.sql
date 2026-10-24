-- RECS import (003-recs-import): deals sent from RECS calculators, stored as opaque payloads.
-- CreateTable
CREATE TABLE "recs_deals" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "c" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "d" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "recs_deals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recs_deals_public_id_key" ON "recs_deals"("public_id");

-- CreateIndex
CREATE INDEX "recs_deals_tenant_id_idx" ON "recs_deals"("tenant_id");

-- CreateIndex
CREATE INDEX "recs_deals_tenant_id_user_id_deleted_at_created_at_idx" ON "recs_deals"("tenant_id", "user_id", "deleted_at", "created_at");

-- AddForeignKey
ALTER TABLE "recs_deals" ADD CONSTRAINT "recs_deals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recs_deals" ADD CONSTRAINT "recs_deals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Row-Level Security policy for the new table
ALTER TABLE "recs_deals" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "recs_deals"
  USING ("tenant_id" = current_setting('app.current_tenant_id')::int);
