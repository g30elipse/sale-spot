import { createContext, type ComponentChildren } from 'preact'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { kvGet, kvSet } from './db'
import { DEFAULT_SETTINGS, SEED_MENU, mergeItems, modLabel, money, unitPrice, type CsvRow } from './lib'
import {
  getAuthState, handleAuthRedirect, hasStoredSession, pullStore, pushItems, pushOrders,
  pushSettings, sendCode, signOut, syncEnabled, verifyCode, type AuthState
} from './sync'
import { applyTheme } from './theme'
import type { CartLine, Item, Order, Selection, Settings, Tender, ToastMsg } from './types'

interface PosStore {
  loaded: boolean
  items: Item[]
  orders: Order[]
  settings: Settings
  cart: CartLine[]
  cartSubtotal: number
  receipt: Order | null
  online: boolean
  now: number
  toast: ToastMsg | null
  syncEnabled: boolean
  /** orders (or voids) not yet on the server */
  queued: number
  /** connection/sync status line shown on receipt + settings */
  syncNote: string
  syncNow: () => void
  auth: AuthState
  /** true once this device has signed in — gates the whole app */
  signedIn: boolean
  sendCode: (email: string) => Promise<void>
  /** verifies the emailed code, then reboots into the account's data */
  verifyCode: (email: string, code: string) => Promise<void>
  signOutAccount: () => Promise<void>
  fmt: (pence: number) => string
  showToast: (msg: string, actionLabel?: string, action?: () => void) => void
  patchSettings: (patch: Partial<Settings>) => void
  addToCart: (item: Item, sel: Selection, qty: number) => void
  updateLine: (key: string, item: Item, sel: Selection, qty: number) => void
  setLineQty: (key: string, delta: number) => void
  removeLine: (key: string) => void
  clearCart: () => void
  completeOrder: (tender: Tender, cash: number) => void
  clearReceipt: () => void
  voidOrder: (id: string) => void
  toggleSoldOut: (id: string) => void
  merge: (rows: CsvRow[]) => void
  /** replace the whole menu — used by onboarding to seed or clear it */
  setMenu: (items: Item[]) => void
}

/** Set just before the post-sign-in reload, so the next boot restores from the server. */
const PULL_KEY = 'bytes-pos.pull-on-boot'
/** Last account this device held, to detect a switch and not leak data between them. */
const USER_KEY = 'bytes-pos.user-id'

const PosContext = createContext<PosStore | null>(null)

export function usePos(): PosStore {
  const store = useContext(PosContext)
  if (!store) throw new Error('usePos outside <PosProvider>')
  return store
}

export function PosProvider({ children }: { children: ComponentChildren }) {
  const [loaded, setLoaded] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [cart, setCart] = useState<CartLine[]>([])
  const [receipt, setReceipt] = useState<Order | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [now, setNow] = useState(Date.now())
  const [toast, setToast] = useState<ToastMsg | null>(null)
  const [auth, setAuth] = useState<AuthState>({ status: syncEnabled ? 'signed-out' : 'off' })
  // decided synchronously from the stored session: a cold offline start must
  // still open the till, so nothing network-bound gates this
  const [signedIn, setSignedIn] = useState(() => !syncEnabled || hasStoredSession())
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    (async () => {
      const [i, o, s] = await Promise.all([
        kvGet<Item[]>('items'), kvGet<Order[]>('orders'), kvGet<Settings>('settings')
      ])
      if (!i) await kvSet('items', SEED_MENU)
      let nextItems = i ?? SEED_MENU
      let nextOrders = o ?? []
      let nextSettings: Settings = { ...DEFAULT_SETTINGS, ...s }
      let pendingToast: string | null = null

      if (syncEnabled && hasStoredSession()) {
        const restoring = localStorage.getItem(PULL_KEY) === '1'
        localStorage.removeItem(PULL_KEY)
        try {
          // a clicked link (rather than a typed code) lands its tokens in the
          // URL — consume them before any push, so writes hit the right account
          const redirect = await handleAuthRedirect()
          if (redirect?.error) pendingToast = 'That sign-in link has expired — send yourself a new one'

          if (restoring || redirect) {
            const pulled = await pullStore()
            if (pulled.items.length) nextItems = pulled.items
            if (pulled.settings) {
              nextSettings = {
                ...DEFAULT_SETTINGS, ...pulled.settings,
                orderNo: Math.max(nextSettings.orderNo, pulled.settings.orderNo ?? 0)
              }
            }
            // server history wins, but never drop orders this device hasn't pushed
            const serverIds = new Set(pulled.orders.map(x => x.id))
            nextOrders = [...pulled.orders, ...nextOrders.filter(x => !x.synced && !serverIds.has(x.id))]
              .sort((a, b) => a.createdAt - b.createdAt)
          }
          setAuth(await getAuthState())
        } catch {
          // a failed restore must not block the till — it stays local + queued
          pendingToast ||= 'Could not reach the server — this till is working offline'
        }
      }

      setItems(nextItems)
      setOrders(nextOrders)
      setSettings(nextSettings)
      setLoaded(true)
      if (pendingToast) {
        clearTimeout(toastTimer.current)
        setToast({ msg: pendingToast })
        toastTimer.current = setTimeout(() => setToast(null), 6000)
      }
    })()
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    const clock = setInterval(() => setNow(Date.now()), 30000)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
      clearInterval(clock)
      clearTimeout(toastTimer.current)
    }
  }, [])

  useEffect(() => { if (loaded) kvSet('items', items) }, [loaded, items])
  useEffect(() => { if (loaded) kvSet('orders', orders) }, [loaded, orders])
  useEffect(() => { if (loaded) kvSet('settings', settings) }, [loaded, settings])
  useEffect(() => { if (loaded) applyTheme(settings.theme) }, [loaded, settings.theme])

  const showToast = useCallback((msg: string, actionLabel?: string, action?: () => void) => {
    clearTimeout(toastTimer.current)
    setToast({ msg, actionLabel, action })
    toastTimer.current = setTimeout(() => setToast(null), 5200)
  }, [])

  const patchSettings = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }, [])

  const addToCart = useCallback((item: Item, sel: Selection, qty: number) => {
    const mods = modLabel(item, sel)
    const unit = unitPrice(item, sel)
    setCart(prev => {
      const i = prev.findIndex(l => l.itemId === item.id && l.mods === mods)
      if (i > -1) return prev.map((l, j) => j === i ? { ...l, qty: l.qty + qty } : l)
      return [...prev, { key: crypto.randomUUID(), itemId: item.id, name: item.name, mods, qty, unit, sel }]
    })
  }, [])

  const updateLine = useCallback((key: string, item: Item, sel: Selection, qty: number) => {
    setCart(prev => prev.map(l => l.key === key
      ? { ...l, mods: modLabel(item, sel), qty, unit: unitPrice(item, sel), sel }
      : l))
  }, [])

  const setLineQty = useCallback((key: string, delta: number) => {
    setCart(prev => prev.map(l => l.key === key ? { ...l, qty: l.qty + delta } : l).filter(l => l.qty > 0))
  }, [])

  const removeLine = useCallback((key: string) => {
    const line = cart.find(l => l.key === key)
    setCart(cart.filter(l => l.key !== key))
    if (line) showToast(line.name + ' removed', 'Undo', () => { setCart(cart); setToast(null) })
  }, [cart, showToast])

  const clearCart = useCallback(() => {
    if (!cart.length) return
    setCart([])
    showToast('Order cleared', 'Undo', () => { setCart(cart); setToast(null) })
  }, [cart, showToast])

  const completeOrder = useCallback((tender: Tender, cash: number) => {
    const order: Order = {
      id: crypto.randomUUID(), no: settings.orderNo, createdAt: Date.now(),
      lines: cart.map(l => ({ id: l.itemId, name: l.name, mods: l.mods, qty: l.qty, unit: l.unit })),
      tender, tendered: tender === 'Cash' ? cash : null,
      taxRate: settings.taxRate, voided: false
    }
    setOrders(prev => [...prev, order])
    setReceipt(order)
    setSettings(prev => ({ ...prev, orderNo: prev.orderNo + 1 }))
    setCart([])
    if (!navigator.onLine) showToast('Saved on this tablet — safe until the wifi is back')
  }, [cart, settings.orderNo, settings.taxRate, showToast])

  const clearReceipt = useCallback(() => setReceipt(null), [])

  const voidOrder = useCallback((id: string) => {
    const order = orders.find(o => o.id === id)
    // synced: false re-queues the order so the void reaches the server too
    setOrders(orders.map(o => o.id === id ? { ...o, voided: true, synced: false } : o))
    if (order) showToast(`Order #${order.no} voided`, 'Undo', () => { setOrders(orders); setToast(null) })
  }, [orders, showToast])

  const toggleSoldOut = useCallback((id: string) => {
    setItems(prev => prev.map(x => x.id === id ? { ...x, soldOut: !x.soldOut } : x))
  }, [])

  const merge = useCallback((rows: CsvRow[]) => {
    setItems(prev => {
      const { items: next, created, updated } = mergeItems(prev, rows)
      showToast(`${created} item(s) added, ${updated} updated`)
      return next
    })
  }, [showToast])

  const setMenu = useCallback((next: Item[]) => setItems(next), [])

  const cartSubtotal = useMemo(() => cart.reduce((s, l) => s + l.unit * l.qty, 0), [cart])
  const fmt = useCallback((pence: number) => money(pence, settings.currency), [settings.currency])

  const queued = useMemo(() => syncEnabled ? orders.filter(o => !o.synced).length : 0, [orders])

  const syncBusy = useRef(false)
  const doSync = useCallback(async (manual: boolean) => {
    if (!syncEnabled || syncBusy.current) return
    if (!signedIn) return
    if (!navigator.onLine) {
      if (manual) showToast('Still offline — nothing sent yet')
      return
    }
    syncBusy.current = true
    try {
      const pending = orders.filter(o => !o.synced)
      const pushed = new Set(await pushOrders(pending))
      await pushItems(items)
      await pushSettings(settings)
      if (pushed.size) setOrders(prev => prev.map(o => pushed.has(o.id) ? { ...o, synced: true } : o))
      if (manual) showToast(pushed.size ? `${pushed.size} order(s) synced` : 'Everything already synced')
    } catch {
      if (manual) showToast('Sync failed — will retry when the connection allows')
    } finally {
      syncBusy.current = false
    }
  }, [orders, items, settings, showToast, signedIn])

  const syncRef = useRef(doSync)
  syncRef.current = doSync
  const syncNow = useCallback(() => { void syncRef.current(true) }, [])

  // Auto-sync: debounce pushes whenever data changes or the connection returns.
  // Marking orders synced re-runs this once more as an idempotent no-op.
  useEffect(() => {
    if (!loaded || !syncEnabled || !online || !signedIn) return
    const t = setTimeout(() => { void syncRef.current(false) }, 1500)
    return () => clearTimeout(t)
  }, [loaded, online, signedIn, orders, items, settings])

  const requestCode = useCallback((email: string) => sendCode(email.trim()), [])

  /**
   * Verify the code, then reboot so the normal mount path loads the account's
   * data. Signing in as a *different* account wipes this device's local data
   * first — otherwise the previous owner's orders would push into the new one.
   */
  const submitCode = useCallback(async (email: string, code: string) => {
    const userId = await verifyCode(email.trim(), code)
    if (localStorage.getItem(USER_KEY) !== userId) {
      await Promise.all([kvSet('orders', []), kvSet('items', SEED_MENU), kvSet('settings', DEFAULT_SETTINGS)])
      localStorage.setItem(USER_KEY, userId)
    }
    localStorage.setItem(PULL_KEY, '1')
    location.reload()
  }, [])

  const signOutAccount = useCallback(async () => {
    await signOut()
    setSignedIn(false)
    setAuth({ status: 'signed-out' })
  }, [])

  const syncNote = !syncEnabled
    ? 'Orders are stored on this tablet — connect a Supabase project to enable server sync.'
    : !online
      ? 'Offline. Orders are saved here and upload themselves the moment the wifi is back.'
      : queued
        ? `${queued} order(s) waiting to upload.`
        : 'Online. Every order on this tablet is on the server.'

  const store = useMemo<PosStore>(() => ({
    loaded, items, orders, settings, cart, cartSubtotal, receipt, online, now, toast,
    syncEnabled, queued, syncNote, syncNow, auth, signedIn,
    sendCode: requestCode, verifyCode: submitCode, signOutAccount,
    fmt, showToast, patchSettings, addToCart, updateLine, setLineQty, removeLine, clearCart,
    completeOrder, clearReceipt, voidOrder, toggleSoldOut, merge, setMenu
  }), [loaded, items, orders, settings, cart, cartSubtotal, receipt, online, now, toast,
    queued, syncNote, syncNow, auth, signedIn, requestCode, submitCode, signOutAccount,
    fmt, showToast, patchSettings, addToCart, updateLine, setLineQty, removeLine, clearCart,
    completeOrder, clearReceipt, voidOrder, toggleSoldOut, merge, setMenu])

  return <PosContext.Provider value={store}>{children}</PosContext.Provider>
}
