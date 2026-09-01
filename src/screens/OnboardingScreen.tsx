import { useState } from 'preact/hooks'
import { Pill } from '../components/ui'
import { CATS, CURRENCIES, SEED_MENU, TAX_OPTIONS, money, slug } from '../lib'
import { usePos } from '../store'
import type { Item } from '../types'

type Step = 'shop' | 'money' | 'menu'
const STEPS: Step[] = ['shop', 'money', 'menu']

interface Draft {
  name: string
  price: string
  cat: string
}

const EMPTY_DRAFT: Draft = { name: '', price: '', cat: CATS[0] }

/**
 * First-run setup for a new account. Everything collected here is editable
 * later in Setup — the goal is a till that rings up a real sale in a minute,
 * not a complete configuration.
 */
export function OnboardingScreen() {
  const { auth, patchSettings, setMenu, signOutAccount } = usePos()
  const [step, setStep] = useState<Step>('shop')
  const [shopName, setShopName] = useState('')
  const [currency, setCurrency] = useState(CURRENCIES[0])
  const [taxRate, setTaxRate] = useState(5)
  const [items, setItems] = useState<Item[]>([])
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)

  const priceValue = parseFloat(draft.price)
  const canAdd = draft.name.trim().length > 0 && priceValue > 0
  const addDraft = () => {
    if (!canAdd) return
    const id = slug(draft.name)
    const item: Item = {
      id, name: draft.name.trim(), cat: draft.cat,
      price: Math.round(priceValue * 100), mods: []
    }
    setItems(prev => [...prev.filter(i => i.id !== id), item])
    setDraft({ ...EMPTY_DRAFT, cat: draft.cat })
  }

  const finish = (menu: Item[]) => {
    setMenu(menu)
    patchSettings({ shopName: shopName.trim(), currency, taxRate, onboarded: true })
  }

  const idx = STEPS.indexOf(step)

  return (
    <div class="onboard">
      <div class="onboard__card">
        <div class="onboard__head">
          <div>
            <div class="onboard__kicker">Setting up{auth.status === 'signed-in' ? ` · ${auth.email}` : ''}</div>
            <h1 class="onboard__title">
              {step === 'shop' ? "What's your shop called?"
                : step === 'money' ? 'Money and tax'
                  : 'Your menu'}
            </h1>
          </div>
          <div class="onboard__steps">
            {STEPS.map((s, i) => <span key={s} class={`onboard__dot${i <= idx ? ' onboard__dot--on' : ''}`} />)}
          </div>
        </div>

        {step === 'shop' && (
          <>
            <p class="onboard__lead">This shows on the till and prints on every receipt.</p>
            <div class="field">
              <label>Shop name</label>
              <input class="input input--pill" placeholder="Cafe Aroma" value={shopName} autoFocus
                onInput={e => setShopName((e.target as HTMLInputElement).value)}
                onKeyDown={e => { if (e.key === 'Enter' && shopName.trim()) setStep('money') }} />
            </div>
            <button onClick={() => setStep('money')} disabled={!shopName.trim()}
              class="btn btn-primary btn--cta onboard__next">Continue</button>
          </>
        )}

        {step === 'money' && (
          <>
            <p class="onboard__lead">
              Menu prices include tax — the till shows how much of each sale is tax.
              Both are changeable later.
            </p>
            <div class="kicker">Currency</div>
            <div class="pill-row">
              {CURRENCIES.map(c => (
                <Pill key={c} class="pill--tax" on={currency === c} onClick={() => setCurrency(c)}>{c}</Pill>
              ))}
            </div>
            <div class="kicker" style="margin-top:var(--space-4)">Tax rate</div>
            <div class="pill-row">
              {TAX_OPTIONS.map(v => (
                <Pill key={v} class="pill--tax" on={taxRate === v} onClick={() => setTaxRate(v)}>{v}%</Pill>
              ))}
            </div>
            <div class="onboard__actions">
              <button onClick={() => setStep('shop')} class="btn btn-secondary btn--tall">Back</button>
              <button onClick={() => setStep('menu')} class="btn btn-primary btn--cta" style="flex:1">Continue</button>
            </div>
          </>
        )}

        {step === 'menu' && (
          <>
            <p class="onboard__lead">
              Add a few things you sell. You can add the rest — and photos, sizes and
              milk options — from the Menu screen later.
            </p>

            {items.length > 0 && (
              <div class="onboard__items">
                {items.map(i => (
                  <div key={i.id} class="onboard__item">
                    <span class="onboard__item-name">{i.name}</span>
                    <span class="onboard__item-cat">{i.cat}</span>
                    <span class="onboard__item-price">{money(i.price, currency)}</span>
                    <button onClick={() => setItems(prev => prev.filter(x => x.id !== i.id))}
                      class="btn btn-ghost" style="font-size:13px">Remove</button>
                  </div>
                ))}
              </div>
            )}

            <div class="onboard__row">
              <div class="field" style="flex:1">
                <label>Item</label>
                <input class="input input--pill" placeholder="Masala chai" value={draft.name}
                  onInput={e => setDraft({ ...draft, name: (e.target as HTMLInputElement).value })}
                  onKeyDown={e => { if (e.key === 'Enter') addDraft() }} />
              </div>
              <div class="field" style="width:120px">
                <label>Price ({currency})</label>
                <input class="input input--pill" placeholder="40" inputMode="decimal" value={draft.price}
                  onInput={e => setDraft({ ...draft, price: (e.target as HTMLInputElement).value.replace(/[^0-9.]/g, '') })}
                  onKeyDown={e => { if (e.key === 'Enter') addDraft() }} />
              </div>
            </div>
            <div class="pill-row">
              {CATS.map(c => (
                <Pill key={c} class="pill--form" on={draft.cat === c} onClick={() => setDraft({ ...draft, cat: c })}>{c}</Pill>
              ))}
            </div>
            <button onClick={addDraft} disabled={!canAdd} class="btn btn-secondary btn--tall onboard__add">
              Add item
            </button>

            <div class="onboard__actions">
              <button onClick={() => setStep('money')} class="btn btn-secondary btn--tall">Back</button>
              <button onClick={() => finish(items)} disabled={items.length === 0}
                class="btn btn-primary btn--cta" style="flex:1">
                {items.length ? `Open the till with ${items.length} item${items.length > 1 ? 's' : ''}` : 'Add an item to finish'}
              </button>
            </div>
            <button onClick={() => finish(SEED_MENU)} class="btn btn-ghost onboard__sample">
              Or start with a sample café menu
            </button>
          </>
        )}

        <button onClick={() => void signOutAccount()} class="btn btn-ghost onboard__signout">Sign out</button>
      </div>
    </div>
  )
}
