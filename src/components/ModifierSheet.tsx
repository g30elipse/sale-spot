import { GROUPS, unitPrice } from '../lib'
import { usePos } from '../store'
import type { SheetState } from '../types'
import { Modal, ModalHead } from './Modal'
import { Pill, QtyStepper } from './ui'

interface Props {
  sheet: SheetState
  setSheet: (s: SheetState | null) => void
}

/** Bottom sheet for choosing modifiers and quantity, for a new line or an existing one. */
export function ModifierSheet({ sheet, setSheet }: Props) {
  const { items, fmt, addToCart, updateLine } = usePos()
  const item = items.find(m => m.id === sheet.itemId)
  if (!item) return null

  const confirm = () => {
    if (sheet.lineKey) updateLine(sheet.lineKey, item, sheet.sel, sheet.qty)
    else addToCart(item, sheet.sel, sheet.qty)
    setSheet(null)
  }

  return (
    <Modal variant="sheet" onClose={() => setSheet(null)}>
      <ModalHead baseline title={item.name} meta={fmt(item.price)} onClose={() => setSheet(null)} />
      {item.mods.map(id => {
        const g = GROUPS[id]
        return (
          <div key={id} style="margin-top:var(--space-4)">
            <div class="kicker">{g.label}</div>
            <div class="pill-row">
              {g.opts.map((o, i) => (
                <Pill key={o.label} class="pill--opt" on={sheet.sel[id] === i}
                  onClick={() => setSheet({ ...sheet, sel: { ...sheet.sel, [id]: i } })}>
                  <span>{o.label}</span>
                  {o.d > 0 && <span class="pill-delta">+{(o.d / 100).toFixed(2)}</span>}
                </Pill>
              ))}
            </div>
          </div>
        )
      })}
      <div style="display:flex;align-items:center;gap:14px;margin-top:var(--space-6)">
        <QtyStepper sheet qty={sheet.qty}
          onDec={() => setSheet({ ...sheet, qty: Math.max(1, sheet.qty - 1) })}
          onInc={() => setSheet({ ...sheet, qty: sheet.qty + 1 })} />
        <button onClick={confirm} class="btn btn-primary btn--cta" style="flex:1">
          {(sheet.lineKey ? 'Update · ' : 'Add · ') + fmt(unitPrice(item, sheet.sel) * sheet.qty)}
        </button>
      </div>
    </Modal>
  )
}