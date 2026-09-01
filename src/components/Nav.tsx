import { useLocation } from 'preact-iso'
import { usePos } from '../store'
import { Icon, type IconName } from './icons'

const NAV_ITEMS: { path: string; label: string; icon: IconName }[] = [
  { path: '/', label: 'Order', icon: 'order' },
  { path: '/history', label: 'History', icon: 'history' },
  { path: '/summary', label: 'Day', icon: 'summary' },
  { path: '/menu', label: 'Menu', icon: 'menu' },
  { path: '/settings', label: 'Setup', icon: 'settings' }
]

export function Nav() {
  const { path } = useLocation()
  const { settings, online } = usePos()
  const active = path === '/checkout' || path === '/receipt' ? '/' : path

  return (
    <nav class="rail no-print">
      <div class="rail__logo">
        {settings.logo
          ? <div style={`width:100%;height:100%;background:center/cover no-repeat url(${settings.logo})`} />
          : <span>{(settings.shopName || 'B').trim().charAt(0).toUpperCase()}</span>}
      </div>
      {NAV_ITEMS.map(n => (
        <a key={n.path} href={n.path} class={`rail__item${active === n.path ? ' rail__item--active' : ''}`}>
          <Icon name={n.icon} />
          <span>{n.label}</span>
        </a>
      ))}
      <div class="spacer" />
      <div class={`rail__net${online ? ' rail__net--on' : ''}`} title="Connection status">
        <Icon name={online ? 'online' : 'offline'} />
        <span>{online ? 'Online' : 'Offline'}</span>
      </div>
    </nav>
  )
}
