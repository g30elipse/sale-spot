import { useState } from 'preact/hooks'
import { CsvImportDialog } from '../components/CsvImportDialog'
import { Header } from '../components/Header'
import { NewItemDialog } from '../components/NewItemDialog'
import { GROUPS } from '../lib'
import { usePos } from '../store'

type Dialog = 'new' | 'csv' | null

export function MenuScreen() {
  const { items, fmt, toggleSoldOut } = usePos()
  const [dialog, setDialog] = useState<Dialog>(null)

  return (
    <>
      <Header title="Menu" sub={`${items.length} items · single-level modifiers`}>
        <button onClick={() => setDialog('csv')} class="btn btn-secondary btn--header">Import CSV</button>
        <button onClick={() => setDialog('new')} class="btn btn-primary btn--header" style="font-weight:700">New item</button>
      </Header>
      <div class="screen screen--scroll">
        <div class="panel table-panel">
          <table class="table" style="width:100%">
            <thead>
              <tr>
                <th>Item</th><th>Category</th><th>Modifiers</th>
                <th style="text-align:right">Price</th><th style="text-align:right">Available</th>
              </tr>
            </thead>
            <tbody>
              {items.map(m => (
                <tr key={m.id}>
                  <td style="font-weight:700">{m.name}</td>
                  <td>{m.cat}</td>
                  <td style="color:var(--color-neutral-600);font-size:13px">{m.mods.map(id => GROUPS[id].label).join(', ') || '—'}</td>
                  <td style="text-align:right;font-weight:700">{fmt(m.price)}</td>
                  <td style="text-align:right">
                    <div role="button" tabIndex={0} class={`toggle${m.soldOut ? ' toggle--off' : ''}`}
                      onClick={() => toggleSoldOut(m.id)}>
                      <span />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {dialog === 'new' && <NewItemDialog onClose={() => setDialog(null)} />}
      {dialog === 'csv' && <CsvImportDialog onClose={() => setDialog(null)} />}
    </>
  )
}
