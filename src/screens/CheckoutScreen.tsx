import { useEffect, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { Header } from '../components/Header'
import { Totals } from '../components/Totals'
import { Pill } from '../components/ui'
import { usePos } from '../store'
import type { Tender } from '../types'

const TENDERS: { label: Tender; note: string }[] = [
  { label: 'Cash', note: 'Drawer · change calculated' },
  { label: 'Card', note: 'Paid on the terminal · recorded here' }
]

export function CheckoutScreen() {
  const { cart, cartSubtotal: sub, settings, fmt, completeOrder } = usePos()
  const { route } = useLocation()
  const [tender, setTender] = useState<Tender | null>(null)
  const [cash, setCash] = useState(0)

  // deep link / reload with nothing to check out
  useEffect(() => { if (cart.length === 0) route('/', true) }, [])

  const cashChoices = [sub, Math.ceil(sub / 100) * 100, Math.ceil(sub / 500) * 500, Math.ceil(sub / 1000) * 1000, Math.ceil(sub / 1000) * 1000 + 1000]
    .filter((v, i, a) => a.indexOf(v) === i)
  const cashShort = tender === 'Cash' && cash < sub

  const complete = () => {
    if (!tender) return
    completeOrder(tender, cash)
    route('/receipt')
  }

  return (
    <>
      <Header title="Checkout" sub="Take payment, then hand over the receipt" />
      <div class="screen checkout">
        <section class="checkout__left">
          <div class="checkout__tenders">
            {TENDERS.map(t => (
              <div key={t.label} role="button" tabIndex={0}
                class={`tender${tender === t.label ? ' tender--on' : ''}`}
                onClick={() => { setTender(t.label); setCash(t.label === 'Cash' ? Math.ceil(sub / 100) * 100 : 0) }}>
                <div class="tender__label">{t.label}</div>
                <div class="tender__note">{t.note}</div>
              </div>
            ))}
          </div>
          {tender === 'Cash' && (
            <div class="panel">
              <div class="kicker" style="margin-bottom:12px">Cash tendered</div>
              <div class="cash-options">
                {cashChoices.map((v, i) => (
                  <Pill key={v} class="pill--money" on={cash === v} onClick={() => setCash(v)}>
                    {i === 0 ? 'Exact' : fmt(v)}
                  </Pill>
                ))}
              </div>
              <div class="change-due">
                <span>Change due</span>
                <span>{fmt(Math.max(0, cash - sub))}</span>
              </div>
            </div>
          )}
          <div class="checkout__actions">
            <button onClick={() => route('/')} class="btn btn-secondary btn--tall" style="min-height:60px;padding-inline:28px">Back to order</button>
            <button onClick={complete} disabled={!tender || cashShort} class="btn btn-primary btn--cta" style="min-height:60px;flex:1">
              {tender === 'Cash' ? 'Take cash' : (tender === 'Card' ? 'Card taken — finish' : 'Choose a payment')}
            </button>
          </div>
        </section>
        <aside class="panel checkout__aside">
          <div class="panel__title">Order #{settings.orderNo}</div>
          {cart.map(l => (
            <div key={l.key} class="summary-line">
              <span class="summary-line__qty">{l.qty}×</span>
              <span class="summary-line__name">{l.name}{l.mods && <span class="summary-line__mods">{l.mods}</span>}</span>
              <span>{fmt(l.unit * l.qty)}</span>
            </div>
          ))}
          <div class="divider" style="margin:var(--space-3) 0" />
          <div class="totals"><Totals /></div>
        </aside>
      </div>
    </>
  )
}
