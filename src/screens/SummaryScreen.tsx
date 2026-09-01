import { Header } from '../components/Header'
import { longDate, orderTotal, sameDay, taxOf } from '../lib'
import { usePos } from '../store'

export function SummaryScreen() {
  const { orders, settings, now, fmt, syncEnabled, syncNow } = usePos()
  const today = orders.filter(o => sameDay(o.createdAt, now))
  const live = today.filter(o => !o.voided)

  const daySales = live.reduce((s, o) => s + orderTotal(o), 0)
  const cashSales = live.filter(o => o.tender === 'Cash').reduce((s, o) => s + orderTotal(o), 0)

  const kpis: [string, string, string][] = [
    ['Total sales', fmt(daySales), `${live.length} orders · ${today.length - live.length} voided`],
    ['Cash', fmt(cashSales), 'Count the drawer against this'],
    ['Card', fmt(daySales - cashSales), 'Terminal batch should match'],
    [`Tax (${settings.taxRate}%)`, fmt(taxOf(daySales, settings.taxRate)), 'Included in prices'],
    ['Average order', fmt(live.length ? Math.round(daySales / live.length) : 0), 'Across the shift']
  ]

  const tally: Record<string, { qty: number; total: number }> = {}
  live.forEach(o => o.lines.forEach(l => {
    tally[l.name] = tally[l.name] || { qty: 0, total: 0 }
    tally[l.name].qty += l.qty
    tally[l.name].total += l.unit * l.qty
  }))
  const ranked = Object.entries(tally).sort((a, b) => b[1].qty - a[1].qty).slice(0, 6)
  const maxQty = ranked.length ? ranked[0][1].qty : 1

  return (
    <>
      <Header title="End of day" sub={`${longDate()} · shift totals`} />
      <div class="screen screen--scroll summary">
        <div class="kpis">
          {kpis.map(([label, value, note]) => (
            <div key={label} class="panel kpi">
              <div class="kicker" style="margin-bottom:0">{label}</div>
              <div class="kpi__value">{value}</div>
              <div class="kpi__note">{note}</div>
            </div>
          ))}
        </div>
        <div style="display:flex;gap:var(--space-4);flex-wrap:wrap">
          <div class="panel" style="flex:1;min-width:320px">
            <div class="panel__title">Best sellers</div>
            {ranked.map(([name, v]) => (
              <div key={name} class="bestseller">
                <span class="bestseller__rank">{v.qty}</span>
                <span class="bestseller__name">{name}</span>
                <span class="bestseller__bar" style={`width:${Math.round(20 + 90 * v.qty / maxQty)}px`} />
                <span class="bestseller__total">{fmt(v.total)}</span>
              </div>
            ))}
            {ranked.length === 0 && <div style="color:var(--color-neutral-600);font-size:14px">Nothing sold yet.</div>}
          </div>
          <div class="panel no-print" style="width:340px">
            <div class="panel__title">Close the day</div>
            <div style="font-size:14px;color:var(--color-neutral-700);text-wrap:pretty;margin-bottom:var(--space-4)">
              Count the drawer, match the terminal batch, then print. Voided orders stay in history but are out of every total.
            </div>
            {syncEnabled && (
              <button onClick={syncNow} class="btn btn-secondary btn--tall" style="width:100%;margin-bottom:10px">Sync queued orders</button>
            )}
            <button onClick={() => window.print()} class="btn btn-primary btn--tall" style="width:100%;font-weight:700">Print Z-report</button>
          </div>
        </div>
      </div>
    </>
  )
}
