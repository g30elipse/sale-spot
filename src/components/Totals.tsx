import { taxOf } from '../lib'
import { usePos } from '../store'

/** Net / tax / total rows for the current cart. */
export function Totals({ showNet }: { showNet?: boolean }) {
  const { cartSubtotal: sub, settings, fmt } = usePos()
  const tax = taxOf(sub, settings.taxRate)
  return (
    <>
      {showNet && <div class="totals__row"><span>Net</span><span>{fmt(sub - tax)}</span></div>}
      <div class="totals__row"><span>Tax incl. ({settings.taxRate}%)</span><span>{fmt(tax)}</span></div>
      <div class="totals__grand"><span>Total</span><span>{fmt(sub)}</span></div>
    </>
  )
}
