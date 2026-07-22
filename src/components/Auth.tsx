import { useState, type FormEvent } from 'react'
import { supabase } from '../supabaseClient'

// Signing in with the same account on any browser/device gives you the same
// journal. Email + password keeps setup simple (no email deliverability needed
// if "Confirm email" is disabled in Supabase — see SUPABASE_SETUP.md).
export function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const creds = { email: email.trim(), password }
    const { data, error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword(creds)
        : await supabase.auth.signUp(creds)
    if (error) {
      setMessage(error.message)
    } else if (mode === 'signup' && !data.session) {
      setMessage('Account created. Check your email to confirm, then sign in.')
      setMode('signin')
    }
    // On success with a session, App's auth listener swaps in the app.
    setBusy(false)
  }

  return (
    <div className="auth">
      <form className="auth-card panel" onSubmit={handleSubmit}>
        <h2>{mode === 'signin' ? 'Sign in' : 'Create account'}</h2>
        <p className="muted">
          Your gauge journal syncs to any browser or device you sign in from.
        </p>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
            minLength={6}
          />
        </label>
        {message && <p className="auth-message">{message}</p>}
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? '…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
        <button
          type="button"
          className="btn link-btn"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setMessage(null)
          }}
        >
          {mode === 'signin'
            ? "No account yet? Create one"
            : 'Have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
