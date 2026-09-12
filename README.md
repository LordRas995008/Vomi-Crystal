# Vomi Crystal

Vomi Crystal is a minimalist, non-technical backend bridge for connecting a website or app to authentication, AI, files/storage, usage tracking, and external APIs.

## Why this exists

The creator is under 18 and has repeatedly hit Base44 usage limits while building Vomi. Crystal is designed to move the integration surface into a small, provider-neutral backend while keeping Base44 as the primary UI/data/auth system where available.

> **Important:** this repository does not bypass Base44 limits or impersonate Base44. It provides a real application/backend architecture that can use Base44 services through authenticated server-side calls.

## Architecture

- **UI:** Next.js App Router, minimalist Crystal dashboard
- **Primary data/auth:** Base44 (configure Base44 SDK/API credentials server-side)
- **Backend:** Next.js route handlers / server functions
- **AI:** OpenAI-compatible provider adapter; provider keys are backend-only secrets
- **Storage:** S3-compatible storage adapter
- **Security:** Cloudflare-compatible Turnstile verification + secure HTTP headers
- **Usage:** per-user request/token counters through the data adapter
- **External app API:** `/api/v1/*` endpoints with bearer/API-key authentication

## Implementation status

This is intended to be a working application rather than a static mock. The code includes a real dashboard, server API routes, authentication hooks, usage accounting, AI provider calls, multipart storage uploads, and an external API contract.

Provider credentials are intentionally configuration-driven. Crystal will not guess or expose a Base44 endpoint, storage credential, or AI key.

## Environment

Copy `.env.example` to `.env.local` and configure the services you use. Never commit `.env.local`.

Production AI requires `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL`.

Optional Base44 variables are `BASE44_API_URL`, `BASE44_APP_ID`, and `BASE44_API_KEY`.

Optional storage variables are `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, and `STORAGE_SECRET_KEY`.

Optional security variables are `TURNSTILE_SECRET_KEY` and `CRYSTAL_API_KEY`.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## AI provider

Crystal uses an OpenAI-compatible HTTP contract so the provider can be swapped without changing the UI. The requested "ChatGPT 6 Astra" name is treated as a desired model/provider target, not as a hard-coded claim that such a public API model exists.

## Under-18 note

The creator is under 18. The project should not require publishing private personal information. Hosting/payment/provider accounts must follow each service's age and account rules, with an appropriate adult/guardian involved where a provider requires it.
