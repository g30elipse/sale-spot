export type ModGroupId = 'shot' | 'size' | 'milk' | 'cup' | 'warm'

export interface ModOption {
  label: string
  /** price delta in pence */
  d: number
}

export interface ModGroup {
  id: ModGroupId
  label: string
  opts: ModOption[]
}

/** selected option index per modifier group */
export type Selection = Record<string, number>

export interface Item {
  id: string
  name: string
  cat: string
  /** pence, tax-inclusive */
  price: number
  mods: ModGroupId[]
  soldOut?: boolean
}

export interface CartLine {
  key: string
  itemId: string
  name: string
  /** display label, e.g. "Large · Oat" */
  mods: string
  qty: number
  /** pence */
  unit: number
  sel: Selection
}

export type Tender = 'Cash' | 'Card'

export interface OrderLine {
  id: string
  name: string
  mods: string
  qty: number
  unit: number
}

export interface Order {
  id: string
  no: number
  createdAt: number
  lines: OrderLine[]
  tender: Tender
  /** cash given, pence; null for card */
  tendered: number | null
  /** tax rate snapshot at sale time */
  taxRate: number
  voided: boolean
  /** true once the order (or its void) is on the server; absent = local-only */
  synced?: boolean
}

export interface Settings {
  shopName: string
  logo: string | null
  theme: string
  taxRate: number
  footer: string
  orderNo: number
  currency: string
  /** false until the setup wizard is finished; gates the till for new accounts */
  onboarded: boolean
}

export interface ToastMsg {
  msg: string
  actionLabel?: string
  action?: () => void
}

export interface SheetState {
  itemId: string
  sel: Selection
  qty: number
  /** cart line being edited, or null when adding */
  lineKey: string | null
}
