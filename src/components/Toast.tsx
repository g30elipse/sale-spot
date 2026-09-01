import { usePos } from '../store'

export function Toast() {
  const { toast } = usePos()
  if (!toast) return null
  return (
    <div class="toast no-print">
      <span>{toast.msg}</span>
      {toast.actionLabel && (
        <div role="button" tabIndex={0} class="toast__action" onClick={toast.action}>{toast.actionLabel}</div>
      )}
    </div>
  )
}
