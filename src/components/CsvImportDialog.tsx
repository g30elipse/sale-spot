import { useMemo, useState } from 'preact/hooks'
import { parseCsv } from '../lib'
import { usePos } from '../store'
import { Modal, ModalHead } from './Modal'
import { readFile } from './ui'

export function CsvImportDialog({ onClose }: { onClose: () => void }) {
  const { merge } = usePos()
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')

  const rows = useMemo(() => parseCsv(text), [text])
  const doImport = () => {
    merge(rows)
    onClose()
  }

  return (
    <Modal wide onClose={onClose}>
      <ModalHead title="Import menu" onClose={onClose} />
      <div style="font-size:14px;color:var(--color-neutral-700);text-wrap:pretty">
        One row per item: <strong>name, category, price, modifier groups</strong> — groups separated by
        semicolons. A header row is fine. Existing names are updated, not duplicated.
      </div>
      <label class="dropzone">
        <span class="dropzone__title">Choose a .csv file</span>
        <span class="dropzone__note">{fileName || 'name, category, price, groups'}</span>
        <input type="file" accept=".csv,text/csv" style="display:none"
          onChange={e => readFile(e, false, (content, f) => { setText(content); setFileName(f.name) })} />
      </label>
      <div class="kicker" style="margin-top:var(--space-4);margin-bottom:8px">Or paste rows</div>
      <textarea class="input" style="min-height:132px;border-radius:var(--radius-md);font-family:ui-monospace,monospace;font-size:13px;line-height:1.6;padding:14px"
        placeholder={'Iced latte, Coffee, 3.90, Size;Milk\nMiso cookie, Food, 3.20,'}
        value={text} onInput={e => setText((e.target as HTMLTextAreaElement).value)} />
      <div class="csv-preview">{text ? `${rows.length} valid row(s) found` : ''}</div>
      <div class="modal__actions" style="margin-top:var(--space-4)">
        <button onClick={onClose} class="btn btn-secondary btn--tall" style="padding-inline:26px">Cancel</button>
        <button onClick={doImport} disabled={rows.length === 0} class="btn btn-primary btn--tall" style="flex:1;font-size:18px;font-weight:700">
          {rows.length ? `Import ${rows.length} item(s)` : 'Import'}
        </button>
      </div>
    </Modal>
  )
}
