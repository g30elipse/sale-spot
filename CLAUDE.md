# Bytes POS

Offline-first PWA point-of-sale for small cafés/restaurants. Phase 1 = local-only till;
Phase 2 = SaaS wrapper (auth, onboarding, Stripe billing, server sync — every record
already carries what sync needs, and `store_id` gets added then).

## Commands

- `npm run dev` — Vite dev server (port 5173)
- `npm run build` — `tsc --noEmit` + production build (PWA service worker only exists in the build)
- `npm run typecheck` — TypeScript only
- `npm test` — vitest (pure logic in `src/lib.test.ts`)

## Architecture

- **Preact + TypeScript (strict)** — React idioms apply; `preact/hooks`, class components are banned.
- **Routing:** `preact-iso` — one `<Route>` per screen in `src/app.tsx`. Never conditional screen
  rendering off a `screen` state variable. Plain `<a href>` navigates; `useLocation().route()` for
  programmatic navigation. Screens that depend on transient state (checkout, receipt) redirect
  to `/` on mount when that state is missing.
- **State:** single context store in `src/store.tsx` (`PosProvider` / `usePos()`). All persistence,
  actions, and cross-screen state live there. Screen-local UI state (open dialog, selected
  category, tender) stays in the screen with `useState`.
- **Pure logic** lives in `src/lib.ts` (money, tax, CSV, cart math) — no DOM, fully unit-tested.
  Anything computable without the DOM goes here, not in components.
- **Persistence:** IndexedDB via the tiny kv helper in `src/db.ts` (keys: `items`, `orders`,
  `settings`). No ORM. Write-through from `useEffect` watchers in the store.
- **Sync (`src/sync.ts` + `supabase/migrations/`):** device → server backup against Supabase.
  Configured via `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (see `.env.example`); with no
  config the module is inert and the till runs local-only — never break that mode. Orders push
  when online (`synced` flag; voiding sets `synced: false` to re-push); items/settings upsert
  wholesale, debounced. RLS scopes every table by store ownership. supabase-js is dynamically
  imported — keep it out of the main bundle. Not yet built: live multi-device sync (two tills
  on one store would race).
- **Auth — sign-in is mandatory, there are no anonymous tills.** `SignInScreen` gates the whole
  app: email → 6-digit code (`sendCode` / `verifyCode`). Codes, not links, because the till is a
  shared tablet and a link opens on whichever device holds the inbox.
  - **The gate must never depend on the network.** `hasStoredSession()` decides synchronously
    from the persisted session, so a cold offline start still opens the till; an *expired*
    token must never lock anyone out (it refreshes when the wifi returns), while an *anonymous*
    one is rejected. Never `await` a server check before rendering.
  - Verifying a code reboots the app (`PULL_KEY`) so the normal mount path restores that
    account's data. Signing in as a **different** user (`USER_KEY`) wipes local data first —
    otherwise the previous owner's orders push into the new account.
  - `handleAuthRedirect()` still handles a clicked link, runs before any push, and always
    clears the URL response so a reload can't replay it.
- **Supabase dashboard config that the code depends on:** Auth → URL Configuration Site URL /
  Redirect URLs must list every origin the app runs on (`http://localhost:5173` for dev), and
  the Magic Link email template must include `{{ .Token }}` so the 6-digit code is shown.
  Anonymous sign-ins are no longer used and can be disabled.
- **Components:** `src/screens/*` one file per route; `src/components/*` shared pieces
  (primitives in `ui.tsx`, icons in `icons.tsx`). Sub-components private to one screen stay
  in that screen's file.

## Conventions (do not regress)

- **TypeScript everywhere**, `strict: true`. Shared types in `src/types.ts`.
- **SCSS only** (`src/styles/`): `_ds.scss` is the Organic design system (treat as vendored —
  edit only to retune tokens), `_app.scss` is the app layer, BEM naming
  (`block__element--modifier`). No new inline styles except genuinely dynamic values
  (logo image URL, computed bar widths, sizes passed as props).
- **DRY:** reuse `Pill`, `CircleBtn`, `QtyStepper`, `Modal`/`ModalHead`, `Totals`, `Header`,
  `panel`/`kicker`/`pill-row` classes before writing new markup or CSS.
- **React best practices:** hooks + function components; state updaters stay pure (no side
  effects inside `setX(prev => ...)`); actions wrapped in `useCallback`; derived values via
  `useMemo`; effects clean up after themselves.
- **Money is integer pence** end-to-end; format only at display time via `fmt()` from the store.
  Prices are tax-inclusive; `taxOf()` extracts the included portion.
- **Orders are immutable snapshots** — lines copy name/unit price at sale time, tax rate is
  snapshotted on the order. Void = flag flip, never delete. Never join back to `items` for
  historical totals.
- Design source of truth: `pos-app-mvp-design/project/Bytes POS.dc.html` + the Organic design
  system readme in `pos-app-mvp-design/project/_ds/.../readme.md`. Tokens/vars over hard-coded
  values, pills over sharp corners, Lucide icons at stroke 2.75.

## Testing

Pure logic gets vitest coverage in `src/lib.test.ts`. New money/tax/parsing logic needs a test.
UI is verified manually in the browser (tablet landscape ~1180×820 is the target form factor).
