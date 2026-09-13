# Deploying InvestorOS (Railway)

Everything runs on Railway: a `web` service (Next.js), an `api` service (Express + the
in-process growth-path worker, with Chromium for the Blueprint PDF), Railway Postgres and
Railway Redis. One account, one bill. Both services build from the Dockerfiles in
`frontend/` and `backend/`; `railway.json` in each folder carries the health check and
restart policy.

## One-time setup

1. **Accounts (you):** railway.com (Hobby plan), a domain (Cloudflare Registrar or
   Namecheap), resend.com (Pro for the launch month; the free tier caps at 100 emails a day),
   and credits at console.anthropic.com.
2. **Log in from this repo:** `railway login` (opens the browser). From then on the CLI or the
   dashboard can do everything below.
3. **Project:** `railway init` → name it `investoros`.
4. **Databases:** add PostgreSQL and Redis to the project (`railway add --database postgres`,
   `railway add --database redis`, or Dashboard → New → Database). Railway exposes them to
   other services as `${{Postgres.DATABASE_URL}}` and `${{Redis.REDIS_URL}}`.
5. **Services:** connect the GitHub repo `lsouiher/investor-os` twice (Dashboard → New →
   GitHub repo), or `railway add --service api` / `--service web` and link the repo:
   - `api`: root directory `backend`, variables below, then Networking → Generate Domain
     (or a custom domain such as `api.yourdomain.com`).
   - `web`: root directory `frontend`, variables below, custom domain `app.yourdomain.com`
     (or the root domain).
6. **Escrow the secrets** before the first deploy: copy `JWT_SECRET`,
   `AUDIT_ENCRYPTION_KEY_V1` and `CURRENT_ENCRYPTION_KEY_VERSION` into a password manager.
   A database backup without the encryption key is unreadable income and credit data.

## Variables

`api` service:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `JWT_SECRET` | 32+ random characters (`openssl rand -hex 32`) |
| `AUDIT_ENCRYPTION_KEY_V1` | 64 hex characters (`openssl rand -hex 32`) |
| `CURRENT_ENCRYPTION_KEY_VERSION` | `1` |
| `ANTHROPIC_API_KEY` | the workspace-scoped key |
| `ANTHROPIC_WORKSPACE_ID` | only for an org-level key; otherwise leave unset |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` |
| `RESEND_API_KEY` | from resend.com, after the sending domain is verified |
| `EMAIL_FROM` | `InvestorOS <noreply@yourdomain.com>` (a verified Resend domain) |
| `APP_URL` | `https://app.yourdomain.com` (password-reset links point here) |
| `CORS_ORIGIN` | the exact web origin, e.g. `https://app.yourdomain.com` (comma-separate more) |
| `GROWTH_STRATEGY_DEFAULT_ENABLED` | `true` |
| `NODE_ENV` | `production` |
| `LOG_LEVEL` | `info` |

`web` service (baked in at build time; changing them means a redeploy):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com/api/v1` (the `/api/v1` suffix matters) |
| `NEXT_PUBLIC_FEEDBACK_EMAIL` | the address for the "Send feedback" link |

## What happens on deploy

The `api` container runs `prisma migrate deploy`, then the prompt-template seed (an upsert,
safe every time), then the server. `GET /api/v1/health` must report
`{"status":"ok","checks":{"db":true,"ai":true,"encryption":true,"redis":true}}`; `ai` flips to
`false` if the Anthropic account refuses a call (no credits, bad key), with the reason in the
logs.

## After the first deploy

1. Health check from a phone on cellular; confirm the API log shows the phone's IP, not the
   proxy's (`trust proxy` is set to one hop in `backend/src/main.ts`).
2. Real-API pass: the walkthrough's section R against the deployed host, including ten
   syntheses started in parallel to see the account's rate tier.
3. Mobile pass on iOS Safari and Android Chrome.
4. Email: verify the domain in Resend (SPF, DKIM, DMARC), send a password reset to yourself.

## Ops commands (run inside the api service, `railway run` or the service shell)

- `npm run funnel -- 7` — the beta funnel for the last 7 days, per signup source, with
  ratings and free-text feedback.
- `npm run delete-user -- someone@example.com` — erase a user's answers, generated content,
  contacts and AI logs, and deactivate the account (the promise on the terms page).

## Local equivalents

`docker compose up -d` for Postgres/Redis, then `npm run dev` in each folder (see
`CLAUDE.md`). The production images can be run locally too:
`docker build -t investoros-api backend/` and `docker build -t investoros-web frontend/`.
