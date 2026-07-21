import { useState, useEffect, type FormEvent } from 'react'
import type {
  Swatch,
  Yarn,
  WeightCategory,
  FiberCategory,
  StitchPattern,
  Construction,
  NeedleMaterial,
  MeasurementMethod,
  LengthUnit,
  Measurement,
} from '../types'
import {
  WEIGHT_CATEGORIES,
  FIBER_CATEGORIES,
  STITCH_PATTERNS,
  CONSTRUCTIONS,
  NEEDLE_MATERIALS,
  label,
} from '../types'
import { newYarn } from '../defaults'
import { derivePer10cm } from '../gauge'
import {
  newEntryDraft,
  nextAttempt,
  swatchesToEntry,
  entryToSwatches,
  type EntryDraft,
  type Attempt,
} from '../entry'
import { NumberInput } from './NumberInput'

const round1 = (n: number) => Math.round(n * 10) / 10

/** Editor for a single yarn strand. */
function StrandFields({
  yarn,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  yarn: Yarn
  index: number
  canRemove: boolean
  onChange: (patch: Partial<Yarn>) => void
  onRemove: () => void
}) {
  return (
    <div className="strand">
      <div className="strand-head">
        <span className="strand-title">Strand {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            className="btn danger small"
            onClick={onRemove}
            title="Remove strand"
          >
            ✕
          </button>
        )}
      </div>
      <div className="grid-2">
        <label>
          Brand
          <input
            value={yarn.brand ?? ''}
            onChange={(e) => onChange({ brand: e.target.value })}
            placeholder="e.g. Malabrigo"
          />
        </label>
        <label>
          Name
          <input
            value={yarn.name ?? ''}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Rios"
          />
        </label>
      </div>
      <div className="grid-2">
        <label>
          Fiber category
          <select
            value={yarn.fiberCategory}
            onChange={(e) =>
              onChange({ fiberCategory: e.target.value as FiberCategory })
            }
          >
            {FIBER_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {label(c)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Specific fiber (optional)
          <input
            value={yarn.fiber ?? ''}
            onChange={(e) => onChange({ fiber: e.target.value || undefined })}
            placeholder="e.g. 100% merino"
          />
        </label>
      </div>
      <div className="grid-3">
        <label>
          Weight
          <select
            value={yarn.weightCategory ?? ''}
            onChange={(e) =>
              onChange({
                weightCategory: (e.target.value as WeightCategory) || undefined,
              })
            }
          >
            <option value="">—</option>
            {WEIGHT_CATEGORIES.map((w) => (
              <option key={w} value={w}>
                {label(w)}
              </option>
            ))}
          </select>
        </label>
        <label>
          m / gram
          <NumberInput
            value={yarn.metersPerGram}
            onChange={(v) => onChange({ metersPerGram: v })}
          />
        </label>
        <label>
          WPI
          <NumberInput value={yarn.wpi} onChange={(v) => onChange({ wpi: v })} />
        </label>
      </div>
      <label className="narrow">
        Plies
        <NumberInput value={yarn.plies} onChange={(v) => onChange({ plies: v })} />
      </label>
    </div>
  )
}

/** Editor for one gauge-swatch attempt (needle, technique, measurement). */
function AttemptCard({
  attempt,
  index,
  canRemove,
  onAttempt,
  onRemove,
}: {
  attempt: Attempt
  index: number
  canRemove: boolean
  onAttempt: (patch: Partial<Attempt>) => void
  onRemove: () => void
}) {
  const meas = attempt.measurement
  const unit = meas.unit
  const preview = derivePer10cm(meas)

  function setMethod(method: MeasurementMethod) {
    if (method === meas.method) return
    const next: Measurement =
      method === 'gauge-span'
        ? { method, unit, stitchCount: 0, rowCount: 0, span: unit === 'in' ? 4 : 10 }
        : {
            method,
            unit,
            castOnStitches: 0,
            totalRows: 0,
            measuredWidth: 0,
            measuredHeight: 0,
          }
    onAttempt({ measurement: next })
  }

  function setUnit(nextUnit: LengthUnit) {
    onAttempt({ measurement: { ...meas, unit: nextUnit } })
  }

  return (
    <div className="attempt">
      <div className="strand-head">
        <span className="strand-title">Gauge swatch {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            className="btn danger small"
            onClick={onRemove}
            title="Remove this gauge swatch"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid-2">
        <label>
          Needle size (mm) <span className="req">*</span>
          <NumberInput
            value={attempt.needleSizeMm || undefined}
            onChange={(v) => onAttempt({ needleSizeMm: v ?? 0 })}
            placeholder="e.g. 3.75"
          />
        </label>
        <label className="inline blocked-inline">
          <input
            type="checkbox"
            checked={attempt.blocked}
            onChange={(e) => onAttempt({ blocked: e.target.checked })}
          />
          Blocked
        </label>
      </div>

      <div className="grid-3">
        <label>
          Stitch pattern
          <select
            value={attempt.stitchPattern}
            onChange={(e) =>
              onAttempt({ stitchPattern: e.target.value as StitchPattern })
            }
          >
            {STITCH_PATTERNS.map((p) => (
              <option key={p} value={p}>
                {label(p)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Construction
          <select
            value={attempt.construction}
            onChange={(e) =>
              onAttempt({ construction: e.target.value as Construction })
            }
          >
            {CONSTRUCTIONS.map((c) => (
              <option key={c} value={c}>
                {label(c)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Needle material
          <select
            value={attempt.needleMaterial}
            onChange={(e) =>
              onAttempt({ needleMaterial: e.target.value as NeedleMaterial })
            }
          >
            {NEEDLE_MATERIALS.map((m) => (
              <option key={m} value={m}>
                {label(m)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid-2">
        <label>
          How measured
          <select
            value={meas.method}
            onChange={(e) => setMethod(e.target.value as MeasurementMethod)}
          >
            <option value="gauge-span">Count over a swatch window</option>
            <option value="full-swatch">Made-to-measure whole swatch</option>
          </select>
        </label>
        <label>
          Units
          <select value={unit} onChange={(e) => setUnit(e.target.value as LengthUnit)}>
            <option value="cm">centimeters</option>
            <option value="in">inches</option>
          </select>
        </label>
      </div>

      {meas.method === 'gauge-span' ? (
        <div className="grid-3">
          <label>
            Stitches <span className="req">*</span>
            <NumberInput
              value={meas.stitchCount || undefined}
              onChange={(v) =>
                onAttempt({ measurement: { ...meas, stitchCount: v ?? 0 } })
              }
            />
          </label>
          <label>
            Rows <span className="req">*</span>
            <NumberInput
              value={meas.rowCount || undefined}
              onChange={(v) =>
                onAttempt({ measurement: { ...meas, rowCount: v ?? 0 } })
              }
            />
          </label>
          <label>
            Over ({unit}) <span className="req">*</span>
            <NumberInput
              value={meas.span || undefined}
              onChange={(v) =>
                onAttempt({ measurement: { ...meas, span: v ?? 0 } })
              }
            />
          </label>
        </div>
      ) : (
        <>
          <div className="grid-2">
            <label>
              Stitches cast on <span className="req">*</span>
              <NumberInput
                value={meas.castOnStitches || undefined}
                onChange={(v) =>
                  onAttempt({ measurement: { ...meas, castOnStitches: v ?? 0 } })
                }
              />
            </label>
            <label>
              Rows knit <span className="req">*</span>
              <NumberInput
                value={meas.totalRows || undefined}
                onChange={(v) =>
                  onAttempt({ measurement: { ...meas, totalRows: v ?? 0 } })
                }
              />
            </label>
          </div>
          <div className="grid-2">
            <label>
              Width ({unit}) <span className="req">*</span>
              <NumberInput
                value={meas.measuredWidth || undefined}
                onChange={(v) =>
                  onAttempt({ measurement: { ...meas, measuredWidth: v ?? 0 } })
                }
              />
            </label>
            <label>
              Height ({unit}) <span className="req">*</span>
              <NumberInput
                value={meas.measuredHeight || undefined}
                onChange={(v) =>
                  onAttempt({ measurement: { ...meas, measuredHeight: v ?? 0 } })
                }
              />
            </label>
          </div>
        </>
      )}

      <p className="gauge-preview">
        → <strong>{round1(preview.stitchesPer10cm)}</strong> sts ×{' '}
        <strong>{round1(preview.rowsPer10cm)}</strong> rows / 10&nbsp;cm
        {unit === 'in' && (
          <span className="muted"> &nbsp;(converted from inches)</span>
        )}
      </p>
    </div>
  )
}

export function SwatchForm({
  onSave,
  editing,
  onCancelEdit,
}: {
  onSave: (swatches: Swatch[]) => void | Promise<void>
  editing?: Swatch[] | null
  onCancelEdit?: () => void
}) {
  const [draft, setDraft] = useState<EntryDraft>(() =>
    editing && editing.length ? swatchesToEntry(editing) : newEntryDraft(),
  )

  // Load the selected project when entering edit mode; clear to blank on exit.
  useEffect(() => {
    setDraft(editing && editing.length ? swatchesToEntry(editing) : newEntryDraft())
  }, [editing])

  const isEditing = !!(editing && editing.length)

  // --- Yarn strands (shared across all attempts) ---
  function setStrand(index: number, patch: Partial<Yarn>) {
    setDraft((d) => ({
      ...d,
      yarns: d.yarns.map((y, i) => (i === index ? { ...y, ...patch } : y)),
    }))
  }
  function addStrand() {
    setDraft((d) => ({ ...d, yarns: [...d.yarns, newYarn()] }))
  }
  function removeStrand(index: number) {
    setDraft((d) =>
      d.yarns.length > 1
        ? { ...d, yarns: d.yarns.filter((_, i) => i !== index) }
        : d,
    )
  }

  // --- Gauge-swatch attempts ---
  function setAttempt(index: number, patch: Partial<Attempt>) {
    setDraft((d) => ({
      ...d,
      attempts: d.attempts.map((a, i) => (i === index ? { ...a, ...patch } : a)),
    }))
  }
  function addAttempt() {
    setDraft((d) => ({
      ...d,
      attempts: [...d.attempts, nextAttempt(d.attempts[d.attempts.length - 1])],
    }))
  }
  function removeAttempt(index: number) {
    setDraft((d) =>
      d.attempts.length > 1
        ? { ...d, attempts: d.attempts.filter((_, i) => i !== index) }
        : d,
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const now = new Date().toISOString()
    const { swatches, error } = entryToSwatches(draft, now)
    if (error) {
      alert(error)
      return
    }
    await onSave(swatches)
    // On edit, the parent clears `editing`, which resets the form via the
    // effect. On a new entry, reset here.
    if (!isEditing) setDraft(newEntryDraft())
  }

  const count = draft.attempts.length
  const saveLabel = isEditing
    ? 'Save changes'
    : count > 1
      ? `Save ${count} gauge swatches`
      : 'Save swatch'

  return (
    <form className="swatch-form" onSubmit={handleSubmit}>
      <label className="project-field">
        Project
        <input
          value={draft.project ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, project: e.target.value }))}
          placeholder="e.g. blue cardigan"
        />
      </label>

      <fieldset>
        <legend>Yarn{draft.yarns.length > 1 ? ' (held together)' : ''}</legend>
        {draft.yarns.map((yarn, i) => (
          <StrandFields
            key={i}
            yarn={yarn}
            index={i}
            canRemove={draft.yarns.length > 1}
            onChange={(patch) => setStrand(i, patch)}
            onRemove={() => removeStrand(i)}
          />
        ))}
        <button type="button" className="btn small" onClick={addStrand}>
          + Add strand held together
        </button>
      </fieldset>

      <fieldset>
        <legend>Gauge swatches</legend>
        {draft.attempts.map((attempt, i) => (
          <AttemptCard
            key={i}
            attempt={attempt}
            index={i}
            canRemove={draft.attempts.length > 1}
            onAttempt={(patch) => setAttempt(i, patch)}
            onRemove={() => removeAttempt(i)}
          />
        ))}
        <button type="button" className="btn small" onClick={addAttempt}>
          + Add another gauge swatch (same yarn)
        </button>
      </fieldset>

      <fieldset>
        <legend>Notes</legend>
        <label>
          Notes
          <textarea
            rows={2}
            value={draft.notes ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            placeholder="anything worth remembering"
          />
        </label>
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="btn primary">
          {saveLabel}
        </button>
        {isEditing && (
          <button type="button" className="btn" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
