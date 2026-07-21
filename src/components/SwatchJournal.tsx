import { useState } from 'react'
import type { Swatch } from '../types'
import { label } from '../types'
import { describeMeasurement } from '../gauge'

function matchesQuery(s: Swatch, q: string): boolean {
  if (!q.trim()) return true
  const hay = [
    s.yarn.brand,
    s.yarn.name,
    s.yarn.fiber,
    s.yarn.weightCategory,
    s.stitchPattern,
    s.construction,
    s.project,
    s.notes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(q.trim().toLowerCase())
}

function yarnName(s: Swatch): string {
  const parts = [s.yarn.brand, s.yarn.name].filter(Boolean)
  return parts.length ? parts.join(' ') : '—'
}

export function SwatchJournal({
  swatches,
  onDelete,
}: {
  swatches: Swatch[]
  onDelete: (id: string) => void
}) {
  const [q, setQ] = useState('')

  if (swatches.length === 0) {
    return (
      <p className="muted">
        No swatches yet. Log one on the left to start your journal.
      </p>
    )
  }

  const filtered = swatches.filter((s) => matchesQuery(s, q))

  return (
    <div className="journal">
      <input
        className="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search yarn, fiber, pattern, project, notes…"
      />
      {filtered.length === 0 ? (
        <p className="muted">No swatches match “{q}”.</p>
      ) : (
        <div className="table-scroll">
          <table className="journal-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Yarn</th>
                <th>Fiber</th>
                <th>Needle</th>
                <th>Pattern</th>
                <th>Gauge (10cm)</th>
                <th>Constr.</th>
                <th>Finish</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td>{yarnName(s)}</td>
                  <td>{s.yarn.fiber}</td>
                  <td>{s.needleSizeMm} mm</td>
                  <td>{label(s.stitchPattern)}</td>
                  <td
                    className="nowrap"
                    title={
                      s.measurement ? describeMeasurement(s.measurement) : undefined
                    }
                  >
                    {s.stitchesPer10cm} sts × {s.rowsPer10cm} rows
                  </td>
                  <td>{label(s.construction)}</td>
                  <td className="finish">
                    {s.blocked ? 'blocked' : 'unblocked'}
                  </td>
                  <td className="notes-cell" title={s.notes}>
                    {s.project ? <strong>{s.project}</strong> : null}
                    {s.project && s.notes ? ' — ' : ''}
                    {s.notes}
                  </td>
                  <td>
                    <button
                      className="btn danger small"
                      onClick={() => {
                        if (confirm('Delete this swatch?')) onDelete(s.id)
                      }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
