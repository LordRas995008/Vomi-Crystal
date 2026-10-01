# Vomi Crystal — Base44 Dev Environment

## What this is
A Next.js App Router dashboard ("Vomi Crystal") with server-side AI, storage, and external API integrations. All integrations are optional — the app boots and renders the dashboard without any credentials; unconfigured services simply show as offline in the health endpoint.

## Running
```bash
docker compose -f docker-compose.base44.yml up -d --build
```
- Web entry point: host port 3000 (Next.js dev server, `next dev -H 0.0.0.0`)
- Health check: `GET /api/health` returns `{ ok: true, configured: { ai, auth, files, api, ... } }`
- No database, no external services required to boot.

## Environment variables
All env vars are **optional**. The app starts without any of them.
- `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` — OpenAI-compatible provider; `/api/ai` returns 503 without them.
- `BASE44_API_URL`, `BASE44_APP_ID`, `BASE44_API_KEY` — Base44 server-side integration.
- `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` — S3-compatible storage.
- `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile verification.
- `CRYSTAL_API_KEY` — bearer token protecting `/api/v1` and `/api/ai`; routes are open if unset.

## Key files
- `app/page.tsx` — main dashboard (client component, ~220 lines).
- `app/api/health/route.ts` — reports configured services.
- `app/api/ai/route.ts` — OpenAI-compatible chat endpoint with bounded page-control action protocol.
- `app/api/v1/route.ts` — external API contract with bearer auth.
- `next.config.ts` — includes `allowedDevOrigins` for the preview origin.

## Notes
- No lockfile in the repo; `npm install` runs on container startup.
- No `tsconfig.json`; Next.js auto-generates one on first dev run.
- `index.html` at repo root is a standalone static prototype, not the app entry point — the live app is the Next.js App Router in `app/`.
