# LetterboxdClone

A modern Letterboxd-style app.

- **Frontend:** vanilla JS SPA (hash routing), plain static files
- **API:** Cloudflare Pages Functions proxy for TMDB
- **Auth + data:** Supabase Auth + Postgres

## Quick start

```bash
# Install dependencies
npm install

# Full local dev with TMDB proxy (recommended)
npx wrangler pages dev frontend --compatibility-date=2026-01-01
# Create .dev.vars first — see docs/OPERATIONS.md

# Plain static server (no TMDB)
npm run dev
```

## Project structure

```
.
├─ frontend/          # Static SPA (HTML/CSS/JS)
├─ functions/         # Cloudflare Pages Functions (TMDB proxy)
├─ docs/              # Architecture and ops docs
├─ package.json
├─ wrangler.toml
└─ .dev.vars          # Local secrets (gitignored, create manually)
```

See `docs/ARCHITECTURE_PLAN.md` and `docs/OPERATIONS.md` for full details.
