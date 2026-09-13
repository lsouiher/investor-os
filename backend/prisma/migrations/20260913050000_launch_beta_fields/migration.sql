-- Beta launch fields: where a signup came from, a per-user cache of dashboard insights,
-- and free-text feedback next to the identity rating.
ALTER TABLE "users" ADD COLUMN "signup_source" TEXT;
ALTER TABLE "users" ADD COLUMN "insights_cache" JSONB;
ALTER TABLE "users" ADD COLUMN "insights_generated_at" TIMESTAMP(3);
ALTER TABLE "identity_versions" ADD COLUMN "user_feedback" TEXT;
