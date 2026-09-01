import { useEffect } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { Header } from '../components/Header'
import { ReceiptPaper } from '../components/ReceiptPaper'
import { usePos } from '../store'

export function ReceiptScreen() {
  const { receipt, syncNote, showToast, clearReceipt } = usePos()
  const { route } = useLocation()

  // deep link / reload with no completed order
  useEffect(() => { if (!receipt) route('/', true) }, [])
  if (!receipt) return null

  const newOrder = () => { clearReceipt(); route('/') }

  return (
    <>
      <Header title="Receipt" sub="Order complete" />
      <div class="screen receipt">
        <ReceiptPaper order={receipt} />
        <div class="receipt__actions no-print">
          <p>{syncNote}</p>
          <button onClick={() => window.print()} class="btn btn-secondary btn--tall">Print receipt</button>
          <button onClick={() => showToast('Email receipts arrive with the sync server — Phase 2')} class="btn btn-secondary btn--tall">Email receipt</button>
          <button onClick={newOrder} class="btn btn-primary btn--cta">New order</button>
        </div>
      </div>
    </>
  )
}
