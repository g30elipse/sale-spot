import { hhmm, orderTotal, shortDate, taxOf } from '../lib'
import { usePos } from '../store'
import type { Order } from '../types'

/** The printable receipt. Printing hides everything but this (see @media print). */
export function ReceiptPaper({ order }: { order: Order }) {
  const { settings, fmt } = usePos()
  const total = orderTotal(order)
  return (
    <div id="paper" class="paper">
      <div class="paper__head">
        {settings.logo && <div class="paper__logo" style={`background:center/cover no-repeat url(${settings.logo})`} />}
        <div class="paper__shop">{settings.shopName}</div>
        <div class="paper__meta">Order #{order.no} · {hhmm(order.createdAt)} · {shortDate(order.createdAt)}</div>
      </div>
      <div class="divider" style="margin:18px 0" />
      {order.lines.map((l, i) => (
        <div key={i} class="paper__line">
          <span>{l.qty}×</span>
          <span>{l.name}{l.mods && <span class="paper__mods">{l.mods}</span>}</span>
          <span>{fmt(l.unit * l.qty)}</span>
        </div>
      ))}
      <div class="divider" />
      <div class="paper__row"><span>Tax incl. ({order.taxRate}%)</span><span>{fmt(taxOf(total, order.taxRate))}</span></div>
      <div class="paper__total"><span>Total</span><span>{fmt(total)}</span></div>
      <div class="paper__row" style="margin-top:4px"><span>{order.tender}</span><span>{order.tendered ? fmt(order.tendered) + ' given' : fmt(total)}</span></div>
      <div class="paper__footer">{settings.footer}</div>
    </div>
  )
}
