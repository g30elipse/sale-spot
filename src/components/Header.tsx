import type { ComponentChildren } from 'preact'
import { hhmm } from '../lib'
import { usePos } from '../store'

interface HeaderProps {
  title: string
  sub: string
  /** optional action buttons, right-aligned before the clock */
  children?: ComponentChildren
}

export function Header({ title, sub, children }: HeaderProps) {
  const { now, syncEnabled, online, queued, syncNow } = usePos()
  return (
    <header class="header no-print">
      <div style="min-width:0">
        <div class="header__title">{title}</div>
        <div class="header__sub">{sub}</div>
      </div>
      <div class="spacer" />
      {children && <div class="header__actions">{children}</div>}
      {syncEnabled && online && queued > 0 && (
        <div role="button" tabIndex={0} class="queued-chip" onClick={syncNow}>
          {queued} queued · sync now
        </div>
      )}
      <div class="clock">{hhmm(now)}</div>
    </header>
  )
}
