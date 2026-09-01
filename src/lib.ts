// Pure data + logic shared by the app and its tests. All money is integer pence.
import type { Item, ModGroup, ModGroupId, Order, Selection, Settings } from './types'

export const GROUPS: Record<ModGroupId, ModGroup> = {
  shot: { id: 'shot', label: 'Shots', opts: [{ label: 'Single', d: 0 }, { label: 'Double', d: 60 }] },
  size: { id: 'size', label: 'Size', opts: [{ label: 'Small', d: 0 }, { label: 'Regular', d: 40 }, { label: 'Large', d: 80 }] },
  milk: { id: 'milk', label: 'Milk', opts: [{ label: 'Whole', d: 0 }, { label: 'Oat', d: 40 }, { label: 'Skim', d: 0 }, { label: 'Soy', d: 40 }] },
  cup: { id: 'cup', label: 'Cup', opts: [{ label: 'Stay', d: 0 }, { label: 'Takeaway', d: 0 }] },
  warm: { id: 'warm', label: 'Prep', opts: [{ label: 'As is', d: 0 }, { label: 'Warmed', d: 0 }, { label: 'Butter', d: 50 }] }
}

export const CATS = ['Coffee', 'Not coffee', 'Food', 'Shelf']

export const SEED_MENU: Item[] = [
  { id: 'esp', name: 'Espresso', cat: 'Coffee', price: 240, mods: ['shot', 'cup'] },
  { id: 'mac', name: 'Macchiato', cat: 'Coffee', price: 280, mods: ['shot', 'milk', 'cup'] },
  { id: 'flat', name: 'Flat white', cat: 'Coffee', price: 340, mods: ['milk', 'shot', 'cup'] },
  { id: 'latte', name: 'Latte', cat: 'Coffee', price: 360, mods: ['size', 'milk', 'cup'] },
  { id: 'capp', name: 'Cappuccino', cat: 'Coffee', price: 350, mods: ['size', 'milk', 'cup'] },
  { id: 'filt', name: 'Filter / batch', cat: 'Coffee', price: 300, mods: ['cup'] },
  { id: 'cold', name: 'Cold brew', cat: 'Coffee', price: 380, mods: ['milk', 'cup'] },
  { id: 'mocha', name: 'Mocha', cat: 'Coffee', price: 400, mods: ['size', 'milk', 'cup'] },
  { id: 'brew', name: 'Breakfast tea', cat: 'Not coffee', price: 260, mods: ['cup'] },
  { id: 'chai', name: 'Chai latte', cat: 'Not coffee', price: 360, mods: ['milk', 'cup'] },
  { id: 'matcha', name: 'Matcha latte', cat: 'Not coffee', price: 400, mods: ['milk', 'cup'] },
  { id: 'choc', name: 'Hot chocolate', cat: 'Not coffee', price: 340, mods: ['milk', 'cup'] },
  { id: 'oj', name: 'Orange juice', cat: 'Not coffee', price: 320, mods: [] },
  { id: 'bun', name: 'Cardamom bun', cat: 'Food', price: 420, mods: ['warm'] },
  { id: 'croi', name: 'Almond croissant', cat: 'Food', price: 380, mods: ['warm'] },
  { id: 'toast', name: 'Sourdough toast', cat: 'Food', price: 450, mods: ['warm'] },
  { id: 'roll', name: 'Bacon roll', cat: 'Food', price: 560, mods: [] },
  { id: 'banana', name: 'Banana bread', cat: 'Food', price: 340, mods: ['warm'] },
  { id: 'gran', name: 'Granola pot', cat: 'Food', price: 480, mods: [] },
  { id: 'beans', name: 'Beans 250g', cat: 'Shelf', price: 1100, mods: [] },
  { id: 'cup-item', name: 'Keepcup', cat: 'Shelf', price: 1400, mods: [] }
]

export const CURRENCIES = ['₹', '£', '$', '€']

export const DEFAULT_SETTINGS: Settings = {
  shopName: 'Bytes', logo: null, theme: 'Terracotta', taxRate: 20,
  footer: 'Thanks — see you tomorrow.', orderNo: 1001, currency: '₹',
  onboarded: false
}

/** Tax presets offered in onboarding and Setup. India's GST on food service is 5%. */
export const TAX_OPTIONS = [0, 5, 12, 18]

export const money = (minor: number, cur = '₹'): string => cur + (minor / 100).toFixed(2)

/** Prices are tax-inclusive; tax is the portion of the total. */
export const taxOf = (total: number, ratePct: number): number =>
  Math.round(total - total / (1 + ratePct / 100))

export const slug = (n: string): string => n.toLowerCase().replace(/[^a-z0-9]+/g, '-')

export const defaults = (item: Item): Selection =>
  Object.fromEntries(item.mods.map(id => [id, 0]))

export const modLabel = (item: Item, sel: Selection): string =>
  item.mods.filter(id => sel[id] !== 0).map(id => GROUPS[id].opts[sel[id]].label).join(' · ')

export const unitPrice = (item: Item, sel: Selection): number =>
  item.price + item.mods.reduce((s, id) => s + GROUPS[id].opts[sel[id]].d, 0)

export const orderTotal = (o: Order): number =>
  o.lines.reduce((s, l) => s + l.unit * l.qty, 0)

export const hhmm = (ts: number): string =>
  new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

export const longDate = (): string =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

export const shortDate = (ts: number): string =>
  new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

export const sameDay = (a: number, b: number): boolean =>
  new Date(a).toDateString() === new Date(b).toDateString()

export interface CsvRow {
  id: string
  name: string
  cat: string
  price: number
  mods: ModGroupId[]
}

/** CSV: name, category, price, modifier groups (semicolon-separated). Header rows and unknown groups are dropped. */
export function parseCsv(text: string): CsvRow[] {
  const byLabel = Object.fromEntries(Object.values(GROUPS).map(g => [g.label.toLowerCase(), g.id]))
  return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).flatMap(line => {
    const c = line.split(',').map(s => s.trim())
    const price = parseFloat(c[2])
    if (!c[0] || isNaN(price) || price < 0) return []
    const mods = (c[3] || '').split(';').map(s => byLabel[s.trim().toLowerCase()]).filter((m): m is ModGroupId => !!m)
    const cat = CATS.find(k => k.toLowerCase() === (c[1] || '').toLowerCase()) || 'Food'
    return [{ id: slug(c[0]), name: c[0], cat, price: Math.round(price * 100), mods }]
  })
}

/** Update-or-add by id, preserving soldOut on updated items. */
export function mergeItems(items: Item[], rows: CsvRow[]): { items: Item[]; created: number; updated: number } {
  const out = items.slice()
  let created = 0, updated = 0
  rows.forEach(row => {
    const i = out.findIndex(m => m.id === row.id)
    if (i > -1) { out[i] = { ...out[i], ...row }; updated++ }
    else { out.push(row); created++ }
  })
  return { items: out, created, updated }
}
