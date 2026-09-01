import { useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { Header } from '../components/Header'
import { ModifierSheet } from '../components/ModifierSheet'
import { Totals } from '../components/Totals'
import { CircleBtn, Pill, QtyStepper } from '../components/ui'
import { CATS, defaults } from '../lib'
import { usePos } from '../store'
import type { CartLine, Item, SheetState } from '../types'

export function OrderScreen() {
  const { items, addToCart } = usePos()
  const [cat, setCat] = useState(CATS[0])
  const [sheet, setSheet] = useState<SheetState | null>(null)

  const openSheet = (item: Item) =>
    setSheet({ itemId: item.id, sel: defaults(item), qty: 1, lineKey: null })

  return (
    <>
      <Header title="Order" sub="Tap to add · pencil to customise" />
      <div class="screen order">
        <section class="order__left">
          <div class="order__cats">
            {CATS.map(c => (
              <Pill key={c} class="pill--cat" on={cat === c} onClick={() => setCat(c)}>{c}</Pill>
            ))}
          </div>
          <div class="order__scroll">
            <div class="order__grid">
              {items.filter(m => m.cat === cat).map(item => (
                <ItemTile key={item.id} item={item}
                  onTap={() => addToCart(item, defaults(item), 1)}
                  onCustomise={() => openSheet(item)} />
              ))}
            </div>
          </div>
        </section>
        <CartPanel setSheet={setSheet} />
      </div>
      {sheet && <ModifierSheet sheet={sheet} setSheet={setSheet} />}
    </>
  )
}

function ItemTile({ item, onTap, onCustomise }: { item: Item; onTap: () => void; onCustomise: () => void }) {
  const { fmt } = usePos()
  const out = !!item.soldOut
  return (
    <div role="button" tabIndex={0} class={`tile${out ? ' tile--out' : ''}`} onClick={out ? undefined : onTap}>
      <div class="tile__name">{item.name}</div>
      <div class="tile__meta">
        <span class="tile__price">{fmt(item.price)}</span>
        {out && <span class="tile__hint">Sold out</span>}
      </div>
      {item.mods.length > 0 && !out && (
        <CircleBtn icon="pencil" size={36} variant="tint" class="tile__pencil" title="Customise"
          onClick={e => { e.stopPropagation(); onCustomise() }} />
      )}
    </div>
  )
}

function CartPanel({ setSheet }: { setSheet: (s: SheetState) => void }) {
  const { cart, settings, cartSubtotal, fmt, clearCart } = usePos()
  const { route } = useLocation()
  const empty = cart.length === 0

  return (
    <aside class="cart">
      <div class="cart__head">
        <span class="cart__title">Order #{settings.orderNo}</span>
        <span class="cart__count">{cart.reduce((s, l) => s + l.qty, 0)} items</span>
        <div class="spacer" />
        {!empty && <button onClick={clearCart} class="btn btn-ghost" style="font-size:13px">Clear</button>}
      </div>
      <div class="cart__lines">
        {empty && <div class="cart__empty">Tap a drink to start.<br />Pencil to customise.</div>}
        {cart.map(l => <CartLineRow key={l.key} line={l} setSheet={setSheet} />)}
      </div>
      <div class="cart__foot totals">
        <Totals showNet />
        <button onClick={() => route('/checkout')} disabled={empty} class="btn btn-primary btn--cta" style="margin-top:8px">
          {cartSubtotal ? 'Charge ' + fmt(cartSubtotal) : 'Charge'}
        </button>
      </div>
    </aside>
  )
}

function CartLineRow({ line, setSheet }: { line: CartLine; setSheet: (s: SheetState) => void }) {
  const { items, fmt, setLineQty, removeLine } = usePos()

  const edit = () => {
    const item = items.find(m => m.id === line.itemId)
    if (item) setSheet({ itemId: line.itemId, sel: { ...defaults(item), ...line.sel }, qty: line.qty, lineKey: line.key })
  }

  return (
    <div class="cart-line">
      <div class="cart-line__body">
        <div class="cart-line__name">{line.name}</div>
        {line.mods && <div role="button" tabIndex={0} class="cart-line__mods" onClick={edit}>{line.mods}</div>}
        <QtyStepper class="cart-line__stepper" qty={line.qty}
          onDec={() => setLineQty(line.key, -1)} onInc={() => setLineQty(line.key, 1)} />
      </div>
      <div class="cart-line__right">
        <span class="cart-line__total">{fmt(line.unit * line.qty)}</span>
        <CircleBtn icon="trash" variant="ghost" title="Remove" onClick={() => removeLine(line.key)} />
      </div>
    </div>
  )
}
