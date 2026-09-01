import { useState } from 'preact/hooks'
import { CATS, GROUPS, slug } from '../lib'
import { usePos } from '../store'
import type { ModGroupId } from '../types'
import { Modal, ModalHead } from './Modal'
import { Pill } from './ui'

export function NewItemDialog({ onClose }: { onClose: () => void }) {
  const { settings, merge } = usePos()
  const [name, setName] = useState('')
  const [cat, setCat] = useState(CATS[0])
  const [price, setPrice] = useState('')
  const [mods, setMods] = useState<ModGroupId[]>([])

  const invalid = !name.trim() || !(parseFloat(price) > 0)
  const save = () => {
    merge([{ id: slug(name), name: name.trim(), cat, price: Math.round(parseFloat(price) * 100), mods }])
    onClose()
  }

  return (
    <Modal onClose={onClose}>
      <ModalHead title="New menu item" onClose={onClose} />
      <div style="display:flex;gap:var(--space-3)">
        <div class="field" style="flex:1">
          <label>Name</label>
          <input class="input input--pill" placeholder="Iced latte" value={name}
            onInput={e => setName((e.target as HTMLInputElement).value)} />
        </div>
        <div class="field" style="width:140px">
          <label>Price ({settings.currency})</label>
          <input class="input input--pill" placeholder="3.90" inputMode="decimal" value={price}
            onInput={e => setPrice((e.target as HTMLInputElement).value.replace(/[^0-9.]/g, ''))} />
        </div>
      </div>
      <div style="margin-top:var(--space-3)">
        <div class="kicker">Category</div>
        <div class="pill-row">
          {CATS.map(c => (
            <Pill key={c} class="pill--form" on={cat === c} onClick={() => setCat(c)}>{c}</Pill>
          ))}
        </div>
      </div>
      <div style="margin-top:var(--space-4)">
        <div class="kicker">Modifier groups</div>
        <div class="pill-row">
          {Object.values(GROUPS).map(g => {
            const on = mods.includes(g.id)
            return (
              <Pill key={g.id} class="pill--form" on2={on}
                onClick={() => setMods(on ? mods.filter(x => x !== g.id) : [...mods, g.id])}>
                {g.label}
              </Pill>
            )
          })}
        </div>
      </div>
      <div class="modal__actions">
        <button onClick={onClose} class="btn btn-secondary btn--tall" style="padding-inline:26px">Cancel</button>
        <button onClick={save} disabled={invalid} class="btn btn-primary btn--tall" style="flex:1;font-size:18px;font-weight:700">Add to menu</button>
      </div>
    </Modal>
  )
}
