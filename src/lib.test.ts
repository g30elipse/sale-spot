import { describe, expect, test } from 'vitest'
import { money, taxOf, parseCsv, mergeItems, unitPrice, modLabel, defaults, GROUPS } from './lib'
import type { Item } from './types'

describe('money', () => {
  test('formats minor units, defaulting to rupees', () => {
    expect(money(360)).toBe('₹3.60')
    expect(money(1100, '$')).toBe('$11.00')
    expect(money(360, '£')).toBe('£3.60')
  })
})

describe('tax', () => {
  test('is the included portion', () => {
    expect(taxOf(1200, 20)).toBe(200) // £12 at 20% incl → £2 tax
    expect(taxOf(1200, 0)).toBe(0)
  })
})

describe('modifiers', () => {
  const latte: Item = { id: 'latte', name: 'Latte', cat: 'Coffee', price: 360, mods: ['size', 'milk'] }

  test('unit price and label follow selections', () => {
    const sel = { ...defaults(latte), size: 2, milk: 1 } // Large, Oat
    expect(unitPrice(latte, sel)).toBe(360 + 80 + 40)
    expect(modLabel(latte, sel)).toBe('Large · Oat')
    expect(modLabel(latte, defaults(latte))).toBe('')
  })
})

describe('csv import', () => {
  test('parses valid rows, drops junk, maps groups', () => {
    const rows = parseCsv('name,category,price,groups\nIced latte, Coffee, 3.90, Size;Milk\nBad row,,x\nCookie, food, 3.20,')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({ id: 'iced-latte', name: 'Iced latte', cat: 'Coffee', price: 390, mods: ['size', 'milk'] })
    expect(rows[1].cat).toBe('Food')
  })

  test('merge updates by id and preserves soldOut', () => {
    const items: Item[] = [{ id: 'latte', name: 'Latte', cat: 'Coffee', price: 360, mods: [], soldOut: true }]
    const { items: out, created, updated } = mergeItems(items, [
      { id: 'latte', name: 'Latte', cat: 'Coffee', price: 380, mods: ['milk'] },
      { id: 'new', name: 'New', cat: 'Food', price: 100, mods: [] }
    ])
    expect(created).toBe(1)
    expect(updated).toBe(1)
    expect(out[0].price).toBe(380)
    expect(out[0].soldOut).toBe(true)
    expect(Object.keys(GROUPS)).toHaveLength(5)
  })
})
