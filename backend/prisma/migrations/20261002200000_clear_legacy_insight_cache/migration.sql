-- Data-only, one time. Before 004-french-language, a user without an identity had a "Get started"
-- insight cached in English. The nudge is now written per request in the reader's language and
-- never cached, so clear those rows: the dashboard regenerates the cache from the next identity.
UPDATE "users"
SET "insights_cache" = NULL,
    "insights_generated_at" = NULL
WHERE "insights_cache" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "identity_versions" iv WHERE iv."user_id" = "users"."id");
