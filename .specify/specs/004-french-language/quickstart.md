# Quickstart: Working on and Verifying French

**Feature:** 004-french-language
**Base setup:** see `CLAUDE.md` → Commands (Postgres on 5433, Redis, backend on :3001, frontend on :3000).

Commands marked with a sprint number exist only once that sprint is implemented.

---

## Run the app in French, with no AI cost

```bash
docker compose up -d

# Mock AI (answers in French when the French directive is in the prompt — Sprint 3)
node backend/scripts/mock-anthropic.mjs &

cd backend
npx prisma migrate deploy && npx prisma generate
ANTHROPIC_BASE_URL=http://localhost:3999 ANTHROPIC_API_KEY=sk-ant-mock npm run dev

cd ../frontend
npm run dev
```

The repo lives on `/mnt/c`: file watchers miss changes there, so restart both dev servers after edits.

## See French

| How | What it tests |
|-----|---------------|
| Open `http://localhost:3000/?lang=fr` | Link-forced language (FR-1.4); stays French on the next page |
| Set the browser's preferred language to French, clear the `locale` cookie, open `/` | Detection at first paint (FR-1.3, FR-1.8) |
| Use the language switch on any page | Instant switch; persists on the device, and on the account when signed in |
| Register in French, then sign in from a private window set to English | The account's language wins after sign-in (FR-1.6) |
| `curl -H 'Accept-Language: fr' -X POST localhost:3001/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"x@y.z","password":"wrongpass"}'` | Server messages in French (Sprint 2) |

## Checks

```bash
# Frontend: dictionary parity, placeholders, plurals, negotiation
cd frontend && npm test -- i18n locale

# Frontend: no hard-coded text in JSX (warning in Sprint 1, error from the end of Sprint 2)
cd frontend && npm run lint

# Backend: server dictionary, directive, error rendering
cd backend && npm test -- i18n language error-handler

# Whole AI pipeline as a French user, against the mock (Sprint 3)
cd backend && npm run verify:fr

# Same, against the real API — costs money; ask first
cd backend && ANTHROPIC_API_KEY=… npm run verify:fr -- --real
```

## Adding or changing text

1. Add the key to **both** `frontend/locales/en.json` and `fr.json` (or to both maps in `backend/src/shared/i18n.ts` for text the server writes).
2. Use the term from `glossary.md`. Formal "vous". French typography: non-breaking space before `: ; ? ! %`, guillemets, typographic apostrophes.
3. Counted text gets two keys, `<key>.one` and `<key>.other`, and is called with a `count` parameter.
4. Never concatenate translated fragments; use one key with `{{placeholders}}`.
5. Run the checks above. A missing key fails the parity test; a literal in JSX fails lint.

## Adding an audit question

Add the field to the audit page's structure (name, type, option values), then the keys:

```
audit.<type>.field.<name>.label
audit.<type>.field.<name>.placeholder        (optional)
audit.<type>.option.<name>.<value>           (one per option)
```

Option **values** are what is stored; never translate or rename them.

## Changing what the AI writes in French

Edit `backend/src/shared/ai/language.ts` (rules, glossary, archetype names), then:

```bash
cd backend && npm test -- language && npm run verify:fr
```

Prompt templates in `prisma/seed.ts` stay in English and are shared by both languages.

## Database

```bash
cd backend
npx prisma migrate deploy     # add_user_locale (Sprint 1), add_generated_content_locale (Sprint 3)
npx prisma generate           # a stale client shows up as phantom TypeScript errors

# Put an existing account in French by hand
psql "$DATABASE_URL" -c "UPDATE users SET locale = 'fr' WHERE email = 'you@example.com';"
```

## Funnel per language (Sprint 5)

```bash
cd backend && npm run funnel -- 7
```
