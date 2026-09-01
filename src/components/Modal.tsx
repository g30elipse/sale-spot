import type { ComponentChildren } from 'preact'
import { CircleBtn } from './ui'

interface ModalProps {
  onClose: () => void
  /** 'sheet' slides up from the bottom (modifier sheet); 'center' is a dialog */
  variant?: 'center' | 'sheet'
  wide?: boolean
  children: ComponentChildren
}

export function Modal({ onClose, variant = 'center', wide, children }: ModalProps) {
  return (
    <div class={`modal-backdrop${variant === 'sheet' ? ' modal-backdrop--sheet' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div class={`modal${variant === 'sheet' ? ' modal--sheet' : ''}${wide ? ' modal--wide' : ''}`}>
        {children}
      </div>
    </div>
  )
}

interface ModalHeadProps {
  title: string
  meta?: string
  onClose: () => void
  /** baseline-aligned variant used by the modifier sheet */
  baseline?: boolean
}

export const ModalHead = ({ title, meta, onClose, baseline }: ModalHeadProps) => (
  <div class={`modal__head${baseline ? ' modal__head--baseline' : ''}`}>
    <span class="modal__title" style={baseline ? 'font-size:28px' : ''}>{title}</span>
    {meta && <span class="modal__meta">{meta}</span>}
    <div class="spacer" />
    <CircleBtn icon="x" onClick={onClose} />
  </div>
)
