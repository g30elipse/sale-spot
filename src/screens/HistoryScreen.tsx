import { Header } from '../components/Header'
import { hhmm, longDate, orderTotal, sameDay } from '../lib'
import { usePos } from '../store'

export function HistoryScreen() {
  const { orders, now, fmt, voidOrder, syncEnabled } = usePos()
  const today = orders.filter(o => sameDay(o.createdAt, now))
  const live = today.filter(o => !o.voided)

  const status = (o: typeof orders[number]) =>
    o.voided ? ['tag-neutral', 'Voided']
      : !syncEnabled ? ['tag-accent-2', 'Saved']
        : o.synced ? ['tag-accent-2', 'Synced'] : ['tag-accent', 'Queued']

  return (
    <>
      <Header title="Today" sub={`${longDate()} · ${live.length} orders · ${today.length - live.length} voided`} />
      <div class="screen screen--scroll">
        <div class="panel table-panel">
          <table class="table" style="width:100%">
            <thead>
              <tr>
                <th>Order</th><th>Time</th><th>Items</th><th>Tender</th>
                <th style="text-align:right">Total</th><th>Status</th><th />
              </tr>
            </thead>
            <tbody>
              {today.slice().reverse().map(o => (
                <tr key={o.id} class={o.voided ? 'row-voided' : ''}>
                  <td style="font-weight:700">#{o.no}</td>
                  <td>{hhmm(o.createdAt)}</td>
                  <td style="max-width:280px">{o.lines.map(l => `${l.qty}× ${l.name}`).join(', ')}</td>
                  <td>{o.voided ? '—' : o.tender}</td>
                  <td style="text-align:right;font-weight:700">{fmt(orderTotal(o))}</td>
                  <td><span class={`tag ${status(o)[0]}`}>{status(o)[1]}</span></td>
                  <td style="text-align:right">
                    {o.voided
                      ? <span style="font-size:12px;color:var(--color-neutral-600)">voided</span>
                      : <button onClick={() => voidOrder(o.id)} class="btn btn-ghost" style="font-size:13px">Void</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {today.length === 0 && <div class="table-empty">No orders yet today.</div>}
        </div>
      </div>
    </>
  )
}
