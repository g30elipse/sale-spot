// Lucide-style icons at stroke 2.75, per the Organic design system.
export type IconName =
  | 'order' | 'history' | 'summary' | 'menu' | 'settings'
  | 'online' | 'offline' | 'pencil' | 'plus' | 'minus' | 'trash' | 'x'

const PATHS: Record<IconName, string> = {
  order: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/>',
  history: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>',
  summary: '<line x1="6" y1="20" x2="6" y2="14"/><line x1="12" y1="20" x2="12" y2="9"/><line x1="18" y1="20" x2="18" y2="4"/>',
  menu: '<line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.4"/><circle cx="4" cy="12" r="1.4"/><circle cx="4" cy="18" r="1.4"/>',
  settings: '<line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="17" x2="21" y2="17"/><circle cx="9" cy="7" r="2.6"/><circle cx="16" cy="17" r="2.6"/>',
  online: '<path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5.5 5.5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/>',
  offline: '<line x1="3" y1="3" x2="21" y2="21"/><path d="M8.5 16a5.5 5.5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/>',
  pencil: '<path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 3 22l1.5-4.5Z"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
  x: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>'
}

export function Icon({ name }: { name: IconName }) {
  const html = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round">${PATHS[name]}</svg>`
  return <span class="icon" dangerouslySetInnerHTML={{ __html: html }} />
}
