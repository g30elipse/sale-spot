// Supabase sync + auth — device → server backup, with magic-link accounts.
// Orders push when online (voids re-push), menu and settings upsert wholesale.
// Pull happens only on sign-in (restoring a till); steady state stays push-only.
// ponytail: no live multi-device sync; two tills on one store would race.
// With no env config the module is inert and the till runs local-only.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Item, Order, Settings } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when a Supabase project is configured; everything else no-ops otherwise. */
export const syncEnabled = Boolean(url && key)

let client: SupabaseClient | null = null
let storeId: string | null = null

// dynamic import keeps supabase-js out of the bundle for local-only tills
async function sb(): Promise<SupabaseClient> {
  if (!client) {
    const { createClient } = await import('@supabase/supabase-js')
    client = createClient(url!, key!)
  }
  return client
}

/**
 * The signed-in account's one store row, creating it for a new account.
 * Memoized as a single in-flight promise so concurrent syncs can never
 * create two stores. Throws when signed out — callers must gate on auth.
 */
let storePromise: Promise<string> | null = null

function ensureStore(): Promise<string> {
  storePromise ||= (async () => {
    if (storeId) return storeId
    const s = await sb()
    const { data: { session } } = await s.auth.getSession()
    if (!session) throw new Error('signed out')
    const { data: existing, error: selErr } = await s.from('stores').select('id').limit(1)
    if (selErr) throw selErr
    if (existing?.length) return (storeId = existing[0].id)
    const { data: created, error: insErr } = await s.from('stores').insert({}).select('id').single()
    if (insErr) throw insErr
    return (storeId = created.id)
  })().catch(e => { storePromise = null; throw e }) // failed attempts retry fresh
  return storePromise
}

/** Forget the cached store after an auth change — a different user owns a different store. */
function resetStoreCache(): void {
  storeId = null
  storePromise = null
}

// ── auth ──────────────────────────────────────────────────────────────
// Sign-in is mandatory: no anonymous accounts. The till emails a 6-digit code
// (a link would open on whichever device holds the inbox, not the tablet),
// verifies it here, and from then on the stored session unlocks the app —
// including offline, which is why nothing below is awaited before render.

export type AuthState =
  | { status: 'off' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; email: string }

/** Read a JWT's payload without verifying it — enough to inspect our own claims. */
function jwtClaims(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

/**
 * Whether this device holds a real account session, decided synchronously so a
 * cold offline start still opens the till. An *expired* token must never gate
 * the UI — it refreshes when the wifi returns — but an anonymous one must,
 * since anonymous tills are no longer allowed.
 */
export function hasStoredSession(): boolean {
  if (!syncEnabled) return false
  const key = Object.keys(localStorage).find(k => /^sb-.*-auth-token$/.test(k))
  if (!key) return false
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? 'null')
    const claims = stored?.access_token ? jwtClaims(stored.access_token) : null
    if (!claims) return false
    return claims.is_anonymous !== true
  } catch {
    return false
  }
}

export async function getAuthState(): Promise<AuthState> {
  if (!syncEnabled) return { status: 'off' }
  const { data: { user } } = await (await sb()).auth.getUser()
  if (!user) return { status: 'signed-out' }
  return { status: 'signed-in', email: user.email ?? '' }
}

/**
 * Turn a Supabase auth failure into something a café owner can act on, without
 * hiding the underlying message when it isn't one we recognise.
 */
export function authErrorText(e: unknown): string {
  const err = e as { message?: string; status?: number; code?: string } | null
  const msg = err?.message ?? ''
  if (err?.status === 429 || /rate limit|too many/i.test(msg)) {
    return 'Too many codes requested. Wait a minute, then try again.'
  }
  if (/signups? not allowed|disabled/i.test(msg)) {
    return 'This project is not accepting new sign-ups.'
  }
  if (/invalid|expired|token/i.test(msg)) {
    return 'That code is wrong or has expired. Send a new one.'
  }
  if (/failed to fetch|network/i.test(msg)) {
    return 'No connection to the server. Check the wifi and try again.'
  }
  return msg || 'Something went wrong. Try again.'
}

/** Email a 6-digit sign-in code, creating the account if it's a new address. */
export async function sendCode(email: string): Promise<void> {
  const s = await sb()
  const { error } = await s.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: location.origin }
  })
  if (error) throw error
}

/** Verify the emailed code. Returns the signed-in user's id. */
export async function verifyCode(email: string, token: string): Promise<string> {
  const s = await sb()
  const { data, error } = await s.auth.verifyOtp({ email, token: token.trim(), type: 'email' })
  if (error) throw error
  if (!data.user) throw new Error('Sign-in failed')
  resetStoreCache()
  return data.user.id
}

export interface RedirectResult {
  /** set when the link was expired, already used, or rejected */
  error: string | null
}

/**
 * Consume auth tokens if the recipient clicked the link in the email rather
 * than typing the code. Runs before any sync so writes land on the right
 * account. Returns null when the URL carries no auth response at all.
 */
export async function handleAuthRedirect(): Promise<RedirectResult | null> {
  if (!syncEnabled) return null
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(location.search)
  const isResponse = hash.has('access_token') || hash.has('error') || query.has('code')
  if (!isResponse) return null

  let error = hash.get('error_description') || hash.get('error')
  try {
    const s = await sb()
    await s.auth.getSession() // waits for detectSessionInUrl to consume the URL
  } catch (e) {
    error ||= e instanceof Error ? e.message : 'Sign-in link could not be used'
  } finally {
    // always clear the response from the URL, so a reload can't replay it
    history.replaceState(null, '', location.pathname)
    resetStoreCache()
  }
  return { error }
}

export async function signOut(): Promise<void> {
  await (await sb()).auth.signOut()
  resetStoreCache()
}

/** Everything this account has on the server — used to restore a till. */
export async function pullStore(): Promise<{ items: Item[]; orders: Order[]; settings: Settings | null }> {
  const sid = await ensureStore()
  const s = await sb()
  const [items, orders, settings] = await Promise.all([
    s.from('items').select('*').eq('store_id', sid),
    s.from('orders').select('*').eq('store_id', sid),
    s.from('settings').select('data').eq('store_id', sid).maybeSingle()
  ])
  if (items.error) throw items.error
  if (orders.error) throw orders.error
  if (settings.error) throw settings.error
  return {
    items: (items.data ?? []).map(rowToItem),
    orders: (orders.data ?? []).map(rowToOrder),
    settings: (settings.data?.data as Settings) ?? null
  }
}

// Row mappers (exported for tests): camelCase app shapes ↔ snake_case rows.
export const orderToRow = (o: Order, store_id: string) => ({
  id: o.id, store_id, no: o.no,
  created_at: new Date(o.createdAt).toISOString(),
  lines: o.lines, tender: o.tender, tendered: o.tendered,
  tax_rate: o.taxRate, voided: o.voided
})

export const itemToRow = (m: Item, store_id: string) => ({
  store_id, id: m.id, name: m.name, cat: m.cat,
  price: m.price, mods: m.mods, sold_out: Boolean(m.soldOut)
})

/* eslint-disable @typescript-eslint/no-explicit-any */
export const rowToItem = (r: any): Item => ({
  id: r.id, name: r.name, cat: r.cat, price: r.price,
  mods: r.mods ?? [], soldOut: r.sold_out
})

export const rowToOrder = (r: any): Order => ({
  id: r.id, no: r.no, createdAt: new Date(r.created_at).getTime(),
  lines: r.lines, tender: r.tender, tendered: r.tendered,
  taxRate: Number(r.tax_rate), voided: r.voided, synced: true
})

/** Upsert pending orders; returns the ids now safely on the server. */
export async function pushOrders(orders: Order[]): Promise<string[]> {
  if (!orders.length) return []
  const sid = await ensureStore()
  const { error } = await (await sb()).from('orders').upsert(orders.map(o => orderToRow(o, sid)))
  if (error) throw error
  return orders.map(o => o.id)
}

export async function pushItems(items: Item[]): Promise<void> {
  const sid = await ensureStore()
  const { error } = await (await sb()).from('items').upsert(items.map(m => itemToRow(m, sid)))
  if (error) throw error
}

export async function pushSettings(settings: Settings): Promise<void> {
  const sid = await ensureStore()
  const { error } = await (await sb()).from('settings')
    .upsert({ store_id: sid, data: settings, updated_at: new Date().toISOString() })
  if (error) throw error
}
