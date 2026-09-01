import { describe, expect, test } from 'vitest'
import { itemToRow, orderToRow, rowToItem, rowToOrder } from './sync'
import type { Item, Order } from './types'

describe('row mappers', () => {
  test('order maps to a snake_case row with ISO timestamp', () => {
    const order: Order = {
      id: 'uuid-1', no: 1001, createdAt: Date.UTC(2026, 8, 1, 9, 30),
      lines: [{ id: 'latte', name: 'Latte', mods: 'Oat', qty: 2, unit: 400 }],
      tender: 'Cash', tendered: 1000, taxRate: 20, voided: false, synced: false
    }
    expect(orderToRow(order, 'store-1')).toEqual({
      id: 'uuid-1', store_id: 'store-1', no: 1001,
      created_at: '2026-09-01T09:30:00.000Z',
      lines: order.lines, tender: 'Cash', tendered: 1000,
      tax_rate: 20, voided: false
    })
  })

  test('item maps soldOut → sold_out boolean', () => {
    const item: Item = { id: 'latte', name: 'Latte', cat: 'Coffee', price: 360, mods: ['milk'] }
    expect(itemToRow(item, 'store-1')).toEqual({
      store_id: 'store-1', id: 'latte', name: 'Latte', cat: 'Coffee',
      price: 360, mods: ['milk'], sold_out: false
    })
  })
})

describe('pull round-trip', () => {
  test('an order survives push → pull unchanged (and comes back synced)', () => {
    const order: Order = {
      id: 'uuid-1', no: 1001, createdAt: Date.UTC(2026, 8, 1, 9, 30),
      lines: [{ id: 'latte', name: 'Latte', mods: 'Oat', qty: 2, unit: 400 }],
      tender: 'Cash', tendered: 1000, taxRate: 20, voided: false, synced: true
    }
    expect(rowToOrder(orderToRow(order, 'store-1'))).toEqual(order)
  })

  test('an item survives push → pull unchanged', () => {
    const item: Item = { id: 'latte', name: 'Latte', cat: 'Coffee', price: 360, mods: ['milk'], soldOut: true }
    expect(rowToItem(itemToRow(item, 'store-1'))).toEqual(item)
  })
})
