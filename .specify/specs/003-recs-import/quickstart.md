# Quickstart: RECS Import

Prerequisites: the usual setup in `CLAUDE.md` (Postgres on 5433, Redis, backend `.env`,
frontend `.env.local`). Remember the WSL note: restart dev servers after edits.

## 1. Migrate and run

```bash
cd backend && npx prisma migrate deploy && npx prisma generate && npm run dev   # fails fast if config/recs.json is missing
cd frontend && NEXT_PUBLIC_RECS_URL=http://localhost:5173 npm run dev           # RECS dev origin
```

## 2. Tests

```bash
cd backend && npx jest src/modules/recs-deal
cd frontend && npx jest lib/recs-import lib/next-path lib/signup-source app/import components/hub/recs-deals config/recs.drift
```

## 3. Try it without RECS

Build a link by hand (any base64url string is a valid payload for this app):

```
http://localhost:3000/import?ref=recs#c=multifamily&n=Elm%20St%20%26%20Co%20%2312&d=N4IgLgpgdg5g
```

- Signed out: name "Elm St & Co #12" and "Multifamily" show, with Sign in / Create an account.
  Register → back on `/import` → Save → hub lists it last, below the audit cards.
- Address bar shows `/import` only after arrival. Reload: nothing to import.
- `c=nope`, `d=abc+def` or a 121-character name: "nothing to import".
- `SELECT signup_source FROM users ORDER BY id DESC LIMIT 1;` → `recs`.

## 4. Round trip against RECS (acceptance, once per calculator slug)

Run RECS locally with `VITE_INVESTORSMAP_URL=http://localhost:3000` (RECS repo, read-only: set
the variable in its local env only). For each of the eight calculators: edit a deal → Send →
Save → hub → Open in RECS → the summary strip is identical → delete → gone after reload.
Record results in `.specify/specs/003-recs-import/qa.md`.

## 5. Ops

```bash
cd backend && npm run funnel -- 7          # "recs" appears as a source
psql … -c "SELECT user_id, count(*) FROM recs_deals WHERE deleted_at IS NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 5;"
npm run delete-user -- someone@example.com # recs_deals count in the summary
```

Adding a calculator later: add the slug to `backend/config/recs.json` and `frontend/config/recs.json`,
add EN/FR labels, deploy, **then** tell RECS (it turns Send on for that slug, RECS Q-17).
