import { useState } from 'preact/hooks'
import { usePos } from '../store'
import { authErrorText } from '../sync'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/**
 * The gate. A code beats a link here: the till is a shared tablet, and an
 * emailed link would open on whichever phone holds the inbox instead.
 */
export function SignInScreen() {
  const { sendCode, verifyCode, online } = usePos()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [stage, setStage] = useState<'email' | 'code'>('email')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    setBusy(true); setError(null)
    try {
      await sendCode(email)
      setStage('code')
    } catch (e) {
      setError(authErrorText(e))
    } finally { setBusy(false) }
  }

  const verify = async () => {
    setBusy(true); setError(null)
    try {
      await verifyCode(email, code) // reloads on success
    } catch (e) {
      setError(authErrorText(e))
      setBusy(false)
    }
  }

  return (
    <div class="signin">
      <div class="signin__card">
        <div class="signin__mark">B</div>
        <h1 class="signin__title">Bytes POS</h1>

        {!online && (
          <div class="signin__offline">
            You need internet to sign in the first time. After that this till works offline.
          </div>
        )}

        {stage === 'email' ? (
          <>
            <p class="signin__lead">Sign in with your email. We'll send you a 6-digit code.</p>
            <div class="field">
              <label>Email</label>
              <input class="input input--pill" type="email" inputMode="email" autoComplete="email"
                placeholder="you@cafe.com" value={email} disabled={busy}
                onInput={e => setEmail((e.target as HTMLInputElement).value)}
                onKeyDown={e => { if (e.key === 'Enter' && EMAIL_RE.test(email) && !busy) void send() }} />
            </div>
            {error && <div class="signin__error">{error}</div>}
            <button onClick={() => void send()} disabled={!EMAIL_RE.test(email) || busy || !online}
              class="btn btn-primary btn--cta signin__submit">
              {busy ? 'Sending…' : 'Email me a code'}
            </button>
          </>
        ) : (
          <>
            <p class="signin__lead">
              Enter the 6-digit code sent to <strong>{email}</strong>.
            </p>
            <div class="field">
              <label>Code</label>
              <input class="input input--pill signin__code" inputMode="numeric" autoComplete="one-time-code"
                placeholder="123456" maxLength={6} value={code} disabled={busy}
                onInput={e => setCode((e.target as HTMLInputElement).value.replace(/\D/g, ''))}
                onKeyDown={e => { if (e.key === 'Enter' && code.length === 6 && !busy) void verify() }} />
            </div>
            {error && <div class="signin__error">{error}</div>}
            <button onClick={() => void verify()} disabled={code.length !== 6 || busy}
              class="btn btn-primary btn--cta signin__submit">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
            <button onClick={() => { setStage('email'); setCode(''); setError(null) }} disabled={busy}
              class="btn btn-ghost signin__back">Use a different email</button>
          </>
        )}
      </div>
    </div>
  )
}
