import { AccountPanel } from '../components/AccountPanel'
import { Header } from '../components/Header'
import { Pill, readFile } from '../components/ui'
import { CURRENCIES, TAX_OPTIONS } from '../lib'
import { usePos } from '../store'
import { THEMES, ramp } from '../theme'

export function SettingsScreen() {
  const { settings, online, patchSettings, syncNote } = usePos()

  return (
    <>
      <Header title="Setup" sub="Brand, tax, receipts and sync" />
      <div class="screen settings">
        <div class="panel settings__main">
          <div class="panel__title" style="margin-bottom:var(--space-4)">This shop</div>
          <div class="field" style="margin-bottom:var(--space-4)">
            <label>Name — shows on the till and every receipt</label>
            <input class="input input--pill" value={settings.shopName}
              onInput={e => patchSettings({ shopName: (e.target as HTMLInputElement).value })} />
          </div>
          <div class="kicker">Logo</div>
          <div class="logo-row">
            <div class="logo-preview">
              {settings.logo
                ? <div style={`width:100%;height:100%;background:center/cover no-repeat url(${settings.logo})`} />
                : <span>{(settings.shopName || 'B').trim().charAt(0).toUpperCase()}</span>}
            </div>
            <label class="btn btn-secondary btn--header" style="cursor:pointer">
              <span>{settings.logo ? 'Replace logo' : 'Upload logo'}</span>
              <input type="file" accept="image/*" style="display:none"
                onChange={e => readFile(e, true, data => patchSettings({ logo: data }))} />
            </label>
            {settings.logo && (
              <button onClick={() => patchSettings({ logo: null })} class="btn btn-ghost" style="font-size:14px">Remove</button>
            )}
          </div>
          <div class="kicker" style="margin-top:var(--space-4)">Theme</div>
          <div class="pill-row" style="gap:12px">
            {THEMES.map(t => {
              const a = ramp(t.h, t.c), b = ramp(t.h2, (t.c || 1) * 0.75)
              return (
                <div key={t.label} role="button" tabIndex={0} title={t.label}
                  class={`theme-chip${settings.theme === t.label ? ' theme-chip--on' : ''}`}
                  onClick={() => patchSettings({ theme: t.label })}>
                  <span class="theme-chip__swatch" style={`background:${a[4]};box-shadow:inset 0 0 0 4px ${b[4]}`} />
                  <span class="theme-chip__label">{t.label}</span>
                </div>
              )
            })}
          </div>
          <div class="divider" style="margin:var(--space-6) 0 var(--space-4)" />
          <div class="panel__title" style="margin-bottom:var(--space-4)">Tax</div>
          <div style="font-size:14px;color:var(--color-neutral-700);margin-bottom:12px">
            One rate, applied to every line. Menu prices are tax-inclusive.
          </div>
          <div class="pill-row">
            {TAX_OPTIONS.map(v => (
              <Pill key={v} class="pill--tax" on={settings.taxRate === v}
                onClick={() => patchSettings({ taxRate: v })}>{v}%</Pill>
            ))}
          </div>
          <div class="kicker" style="margin-top:var(--space-4)">Currency</div>
          <div class="pill-row">
            {CURRENCIES.map(c => (
              <Pill key={c} class="pill--tax" on={settings.currency === c}
                onClick={() => patchSettings({ currency: c })}>{c}</Pill>
            ))}
          </div>
        </div>
        <div class="settings__side">
          <AccountPanel />
          <div class="panel">
            <div class="panel__title" style="margin-bottom:var(--space-4)">Receipts &amp; sync</div>
            <div class="field" style="margin-bottom:var(--space-3)">
              <label>Receipt footer</label>
              <input class="input" value={settings.footer}
                onInput={e => patchSettings({ footer: (e.target as HTMLInputElement).value })} />
            </div>
            <div class="field" style="margin-bottom:var(--space-3)">
              <label>Receipt printer</label>
              <input class="input" value="System print dialog (browser)" readOnly />
            </div>
            <div class={`sync-note${online ? ' sync-note--on' : ''}`}>
              <span />
              <span>{syncNote}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
