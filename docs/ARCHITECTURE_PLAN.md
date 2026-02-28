# Architecture Plan

## Overview

Letterboxd Clone is a static SPA fronted by Cloudflare Pages, with Supabase handling all auth and user data.

```
Browser → Cloudflare Pages (static SPA + Functions)
                │
                ├─ /api/v1/movies/* → TMDB API (proxied, key hidden server-side)
                ├─ /api/v1/health   → health check
                └─ auth / reviews / watchlist → Supabase JS SDK (client-side direct)
```

## Key design decisions

- **No custom backend server.** All API logic runs as Cloudflare Pages Functions (edge workers). The Node `server.js` is only used for local static file serving without Wrangler.
- **Supabase direct from the browser.** Auth, reviews, and watchlist writes go straight to Supabase via the JS SDK. No server-side JWT needed.
- **TMDB key is server-side only.** The `TMDB_API_KEY` env var is only readable by Pages Functions, never exposed to the browser.
- **Hash routing.** The SPA uses `#/route` URLs so Cloudflare Pages serves `index.html` for all paths without needing redirect rules.

## Local development

```bash
# Option A: plain static server (no TMDB proxy)
npm run dev

# Option B: full Cloudflare Pages emulation (TMDB works)
npx wrangler pages dev frontend --compatibility-date=2026-01-01
# requires .dev.vars with TMDB_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY
```

## Deployment

Push to GitHub → Cloudflare Pages auto-deploys from the repo root.
Build output directory: `frontend`
Build command: *(empty — no build step)*
