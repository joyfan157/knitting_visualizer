import { useEffect, useState, type ChangeEvent } from 'react'
import type { Swatch } from './types'
import {
  getAllSwatches,
  saveSwatch,
  deleteSwatch,
  importSwatches,
} from './db'
import { SwatchForm } from './components/SwatchForm'
import { SwatchJournal } from './components/SwatchJournal'
import { Predictor } from './components/Predictor'

export default function App() {
  const [swatches, setSwatches] = useState<Swatch[]>([])
  const [loading, setLoading] = useState(true)
  // The group of swatches currently loaded into the form for editing (one
  // project + yarn). null = creating a new entry.
  const [editing, setEditing] = useState<Swatch[] | null>(null)

  async function refresh() {
    setSwatches(await getAllSwatches())
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [])

  async function handleSave(toSave: Swatch[]) {
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
  }

  async function handleDelete(id: string) {
    if (editing?.some((s) => s.id === id)) setEditing(null)
    await deleteSwatch(id)
    await refresh()
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
      const parsed = JSON.parse(await file.text()) as Swatch[]
      if (!Array.isArray(parsed)) throw new Error('not an array')
      await importSwatches(parsed)
      await refresh()
    } catch {
      alert('Could not read that file — expected a gauge-journal JSON export.')
    }
    e.target.value = ''
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧶 Knitting Gauge Journal</h1>
        <p className="tagline">Log your swatches. Predict your gauge.</p>
      </header>

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
        Local-first — your data stays in this browser. Export regularly to back
        it up.
      </footer>
    </div>
  )
}
