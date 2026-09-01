import { usePos } from '../store'

/** Account section in Setup: who this till is signed in as. */
export function AccountPanel() {
  const { auth, signOutAccount } = usePos()
  if (auth.status === 'off') return null

  return (
    <div class="panel" style="margin-bottom:var(--space-4)">
      <div class="panel__title" style="margin-bottom:var(--space-3)">Account</div>
      <div class="account__row">
        <span class="tag tag-accent-2">Signed in</span>
        <span class="account__email">{auth.status === 'signed-in' ? auth.email : '…'}</span>
      </div>
      <div class="account__note">
        Sales back up to this account. Sign in with the same address on another tablet to
        restore the menu and history there.
      </div>
      <button onClick={() => void signOutAccount()} class="btn btn-secondary btn--tall" style="width:100%">
        Sign out
      </button>
    </div>
  )
}
