// Small shared primitives: pill buttons, circular icon buttons, quantity stepper.
import type { ComponentChildren } from 'preact'
import { Icon, type IconName } from './icons'

interface PillProps {
  on?: boolean
  /** selected state in the second accent (sage) */
  on2?: boolean
  class?: string
  onClick?: () => void
  title?: string
  children: ComponentChildren
}

export const Pill = ({ on, on2, class: cls = '', onClick, title, children }: PillProps) => (
  <div role="button" tabIndex={0} title={title} onClick={onClick}
    class={`pill${on ? ' pill--on' : ''}${on2 ? ' pill--on2' : ''} ${cls}`}>
    {children}
  </div>
)

interface CircleBtnProps {
  icon: IconName
  onClick?: (e: MouseEvent) => void
  size?: number
  variant?: 'line' | 'surface' | 'tint' | 'ghost'
  class?: string
  title?: string
}

export const CircleBtn = ({ icon, onClick, size = 44, variant = 'surface', class: cls = '', title }: CircleBtnProps) => (
  <div role="button" tabIndex={0} title={title} onClick={onClick}
    class={`circle circle--${variant} ${cls}`} style={`width:${size}px;height:${size}px`}>
    <Icon name={icon} />
  </div>
)

interface StepperProps {
  qty: number
  onDec: () => void
  onInc: () => void
  /** larger variant used in the modifier sheet */
  sheet?: boolean
  class?: string
}

export const QtyStepper = ({ qty, onDec, onInc, sheet, class: cls = '' }: StepperProps) => (
  <div class={`stepper${sheet ? ' stepper--sheet' : ''} ${cls}`}>
    <CircleBtn icon="minus" onClick={onDec} size={sheet ? 56 : 44} variant={sheet ? 'surface' : 'line'} />
    <span class="stepper__qty">{qty}</span>
    <CircleBtn icon="plus" onClick={onInc} size={sheet ? 56 : 44} variant={sheet ? 'surface' : 'line'} />
  </div>
)

/** Read the first selected file of an input change event. */
export function readFile(e: Event, asDataUrl: boolean, cb: (content: string, file: File) => void): void {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (!f) return
  const fr = new FileReader()
  fr.onload = () => cb(String(fr.result), f)
  if (asDataUrl) fr.readAsDataURL(f)
  else fr.readAsText(f)
}
