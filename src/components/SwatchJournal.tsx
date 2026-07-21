import { useState } from 'react'
import type { Swatch, Yarn } from '../types'
import { label } from '../types'
import { describeMeasurement } from '../gauge'

function matchesQuery(s: Swatch, q: string): boolean {
  if (!q.trim()) return true
  const hay = [
    s.project,
    ...s.yarns.flatMap((y) => [
      y.brand,
      y.name,
      y.fiber,
      y.fiberCategory,
      y.weightCategory,
    ]),
    s.stitchPattern,
    s.construction,
    s.notes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(q.trim().toLowerCase())
}

function strandName(y: Yarn): string {
  const parts = [y.brand, y.name].filter(Boolean)
  return parts.length ? parts.join(' ') : label(y.fiberCategory)
}

/** Fiber description for one strand: specific text if given, else category. */
function strandFiber(y: Yarn): string {
  return y.fiber?.trim() || label(y.fiberCategory)
}

function yarnLabel(s: Swatch): string {
  return s.yarns
    .map((y) => {
      const name = strandName(y)
      const fiber = strandFiber(y)
      return name === fiber ? name : `${name} (${fiber})`
    })
    .join(' + ')
}

/** Identity of an editable entry: same project + yarn + technique. */
function yarnSignature(s: Swatch): string {
  return s.yarns
    .map(
      (y) =>
        `${y.brand ?? ''}~${y.name ?? ''}~${y.fiberCategory}~${y.fiber ?? ''}~${
          y.weightCategory ?? ''
        }`,
    )
    .join('+')
}

// A project + yarn is one editable group. Stitch pattern, construction and
// needle vary *within* a project, so they are not part of the key.
function groupKey(s: Swatch): string {
  return [(s.project ?? '').trim(), yarnSignature(s)].join('|||')
}

interface Group {
  key: string
  swatches: Swatch[]
}

function buildGroups(swatches: Swatch[]): Group[] {
  const map = new Map<string, Swatch[]>()
  for (const s of swatches) {
    const k = groupKey(s)
    const arr = map.get(k)
    if (arr) arr.push(s)
    else map.set(k, [s])
  }
  const groups: Group[] = [...map.entries()].map(([key, list]) => ({
    key,
    // Gauge swatches within a project sorted by needle size (ascending).
    swatches: [...list].sort((a, b) => a.needleSizeMm - b.needleSizeMm),
  }))
  // Most recently touched project first.
  const recency = (g: Group) =>
    g.swatches.reduce((max, s) => (s.createdAt > max ? s.createdAt : max), '')
  return groups.sort((a, b) => recency(b).localeCompare(recency(a)))
}

export function SwatchJournal({
  swatches,
  onDelete,
  onEdit,
  editingIds,
}: {
  swatches: Swatch[]
  onDelete: (id: string) => void
  onEdit: (group: Swatch[]) => void
  editingIds: string[] | null
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
  const groups = buildGroups(filtered)
  const editingSet = new Set(editingIds ?? [])

  return (
    <div className="journal">
      <input
        className="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search project, yarn, fiber, pattern, notes…"
      />
      {groups.length === 0 ? (
        <p className="muted">No swatches match “{q}”.</p>
      ) : (
        groups.map((group) => {
          const first = group.swatches[0]
          const isEditing = group.swatches.some((s) => editingSet.has(s.id))
          return (
            <div
              key={group.key}
              className={`project-group${isEditing ? ' editing-group' : ''}`}
            >
              <div className="project-head">
                <div>
                  <h3 className="project-title">
                    {first.project?.trim() || (
                      <span className="muted">No project</span>
                    )}
                    {group.swatches.length > 1 && (
                      <span className="count">
                        {' '}
                        · {group.swatches.length} gauge swatches
                      </span>
                    )}
                  </h3>
                  <div className="project-meta muted">
                    {yarnLabel(first)}
                    {first.notes ? ` · ${first.notes}` : ''}
                  </div>
                </div>
                <button
                  className="btn small"
                  onClick={() => onEdit(group.swatches)}
                  title="Edit this project's gauge swatches"
                >
                  Edit
                </button>
              </div>

              <div className="table-scroll">
                <table className="journal-table">
                  <thead>
                    <tr>
                      <th>Needle</th>
                      <th>Pattern</th>
                      <th>Constr.</th>
                      <th>Gauge (per 10cm)</th>
                      <th>Blocked</th>
                      <th>Logged</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.swatches.map((s) => (
                      <tr key={s.id}>
                        <td className="nowrap">{s.needleSizeMm} mm</td>
                        <td>{label(s.stitchPattern)}</td>
                        <td>{label(s.construction)}</td>
                        <td
                          className="nowrap"
                          title={
                            s.measurement
                              ? describeMeasurement(s.measurement)
                              : undefined
                          }
                        >
                          {s.stitchesPer10cm} sts × {s.rowsPer10cm} rows
                        </td>
                        <td className="finish">{s.blocked ? 'yes' : 'no'}</td>
                        <td className="finish">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <button
                            className="btn danger small"
                            onClick={() => {
                              if (confirm('Delete this gauge swatch?'))
                                onDelete(s.id)
                            }}
                            title="Delete this gauge swatch"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
