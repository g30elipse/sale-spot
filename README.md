# Bytes POS

Offline-first point-of-sale for small cafés and restaurants. Preact + TypeScript PWA,
IndexedDB for local storage, Supabase for accounts and backup.

## Develop

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | Typecheck, then production build into `dist/` |
| `npm run preview` | Serve the production build (service worker only exists here) |
| `npm test` | Unit tests for the money/tax/CSV/sync logic |
| `npm run typecheck` | TypeScript only |

Without `.env.local` the app runs local-only: no accounts, no sync. With it, sign-in is
required — see `CLAUDE.md` for the architecture and conventions.

## Deploy to Cloudflare Pages

The build is a static bundle, so Pages' free tier covers it (unlimited bandwidth,
commercial use allowed).

**Settings**

| Field | Value |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variables | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `NODE_VERSION=20` |

Vite inlines `VITE_*` variables at build time, so they must be set on the **build**, not
at runtime. The anon key is meant to be public — row-level security is what protects the
data — but never put the service-role key or the database password here.

**Option A — connect a Git repo** (recommended: every push deploys)

```bash
git init && git add -A && git commit -m "Bytes POS"
```

Push to GitHub, then in Cloudflare: Workers & Pages → Create → Pages → connect the repo
and enter the settings above.

**Option B — upload the build directly**

```bash
npm run build && npx wrangler pages deploy dist --project-name bytes-pos
```

**After the first deploy**, add the site's URL to Supabase → Authentication → URL
Configuration (Site URL and Redirect URLs). Sign-in codes work without it, but the
click-the-link fallback will bounce to the wrong host.

`public/_redirects` handles client-side routing — without it, refreshing on `/history`
returns a 404.

## Email

Sign-in codes go through Supabase's built-in SMTP, which is rate-limited to a couple of
messages per hour and is test-only. Before real customers, configure custom SMTP
(Resend/Postmark) in Supabase → Project Settings → Authentication → SMTP Settings, then
raise the email rate limit under Authentication → Rate Limits. The Magic Link template
must contain `{{ .Token }}` or no code appears in the email.
