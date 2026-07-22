import { useEffect, useState, type ChangeEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Swatch } from './types'
import { supabase, isConfigured } from './supabaseClient'
import {
  getAllSwatches,
  saveSwatch,
  deleteSwatch,
  importSwatches,
} from './db'
import { Auth } from './components/Auth'
import { SwatchForm } from './components/SwatchForm'
import { SwatchJournal } from './components/SwatchJournal'
import { Predictor } from './components/Predictor'

function errorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message)
  }
  return String(e)
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)

  const [swatches, setSwatches] = useState<Swatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // The group of swatches currently loaded into the form for editing (one
  // project + yarn). null = creating a new entry.
  const [editing, setEditing] = useState<Swatch[] | null>(null)

  // Track the auth session.
  useEffect(() => {
    if (!isConfigured) {
      setAuthReady(true)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) =>
      setSession(s),
    )
    return () => sub.subscription.unsubscribe()
  }, [])

  async function refresh() {
    try {
      setSwatches(await getAllSwatches())
      setError(null)
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  // Load (or clear) swatches when the signed-in user changes.
  useEffect(() => {
    if (!session) {
      setSwatches([])
      setLoading(false)
      return
    }
    setLoading(true)
    refresh().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id])

  async function handleSave(toSave: Swatch[]) {
    try {
      // When editing a group, delete any of its original swatches that were
      // removed (their attempt is gone from the saved set).
      if (editing) {
        const savedIds = new Set(toSave.map((s) => s.id))
        for (const orig of editing) {
          if (!savedIds.has(orig.id)) await deleteSwatch(orig.id)
        }
        setEditing(null)
      }
      for (const s of toSave) await saveSwatch(s)
      await refresh()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  async function handleDelete(id: string) {
    try {
      if (editing?.some((s) => s.id === id)) setEditing(null)
      await deleteSwatch(id)
      await refresh()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  function handleEdit(group: Swatch[]) {
    setEditing(group)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(swatches, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gauge-journal-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      if (!Array.isArray(parsed)) throw new Error('not an array')
      await importSwatches(parsed)
      await refresh()
    } catch (err) {
      alert(
        `Import failed: ${errorMessage(err)}. Expected a gauge-journal JSON export.`,
      )
    }
    e.target.value = ''
  }

  // --- Gated states: setup → loading → sign-in → app ---

  if (!isConfigured) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>🧶 Knitting Gauge Journal</h1>
        </header>
        <div className="panel">
          <h2>Finish setup</h2>
          <p>
            Add your Supabase credentials to a <code>.env.local</code> file in
            the project root, then restart the dev server:
          </p>
          <pre className="code-block">
            VITE_SUPABASE_URL=https://your-project.supabase.co{'\n'}
            VITE_SUPABASE_ANON_KEY=your-anon-key
          </pre>
          <p className="muted">
            See <code>SUPABASE_SETUP.md</code> for step-by-step instructions.
          </p>
        </div>
      </div>
    )
  }

  if (!authReady) {
    return (
      <div className="app">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>🧶 Knitting Gauge Journal</h1>
          <p className="tagline">Log your swatches. Predict your gauge.</p>
        </header>
        <Auth />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-row">
          <div>
            <h1>🧶 Knitting Gauge Journal</h1>
            <p className="tagline">Log your swatches. Predict your gauge.</p>
          </div>
          <div className="account">
            <span className="muted">{session.user.email}</span>
            <button className="btn small" onClick={() => supabase.auth.signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          {error}
          <button className="btn small" onClick={refresh}>
            Retry
          </button>
        </div>
      )}

      <div className="columns">
        <section className="panel">
          <h2>{editing ? 'Edit project' : 'Log gauge swatches'}</h2>
          <SwatchForm
            onSave={handleSave}
            editing={editing}
            onCancelEdit={() => setEditing(null)}
          />
        </section>

        <section className="panel">
          <h2>Predict gauge</h2>
          <Predictor swatches={swatches} />
        </section>
      </div>

      <section className="panel">
        <div className="journal-header">
          <h2>
            Swatch journal{' '}
            {swatches.length > 0 && (
              <span className="count">({swatches.length})</span>
            )}
          </h2>
          <div className="journal-actions">
            <button onClick={handleExport} disabled={swatches.length === 0}>
              Export JSON
            </button>
            <label className="btn import-btn">
              Import JSON
              <input
                type="file"
                accept="application/json"
                onChange={handleImport}
                hidden
              />
            </label>
          </div>
        </div>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <SwatchJournal
            swatches={swatches}
            onDelete={handleDelete}
            onEdit={handleEdit}
            editingIds={editing ? editing.map((s) => s.id) : null}
          />
        )}
      </section>

      <footer className="app-footer">
        Synced to your account. Export JSON anytime for an extra backup.
      </footer>
    </div>
  )
}
