import { useState, type FormEvent } from 'react'
import type {
  Swatch,
  Yarn,
  WeightCategory,
  StitchPattern,
  Construction,
  NeedleMaterial,
} from '../types'
import {
  WEIGHT_CATEGORIES,
  STITCH_PATTERNS,
  CONSTRUCTIONS,
  NEEDLE_MATERIALS,
  label,
} from '../types'
import { newSwatchDraft } from '../defaults'

/** '' -> undefined, otherwise Number. Keeps optional numeric fields clean. */
function numOrUndef(v: string): number | undefined {
  return v.trim() === '' ? undefined : Number(v)
}

export function SwatchForm({
  onSave,
}: {
  onSave: (s: Swatch) => void | Promise<void>
}) {
  const [draft, setDraft] = useState(newSwatchDraft())

  function setYarn(patch: Partial<Yarn>) {
    setDraft((d) => ({ ...d, yarn: { ...d.yarn, ...patch } }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft.yarn.fiber.trim()) {
      alert('Fiber composition is required.')
      return
    }
    if (!draft.stitchesPer10cm || !draft.rowsPer10cm) {
      alert('Enter measured stitches and rows per 10cm.')
      return
    }
    const swatch: Swatch = {
      ...draft,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    await onSave(swatch)
    setDraft(newSwatchDraft())
  }

  return (
    <form className="swatch-form" onSubmit={handleSubmit}>
      <fieldset>
        <legend>Yarn</legend>
        <div className="grid-2">
          <label>
            Brand
            <input
              value={draft.yarn.brand ?? ''}
              onChange={(e) => setYarn({ brand: e.target.value })}
              placeholder="e.g. Malabrigo"
            />
          </label>
          <label>
            Name
            <input
              value={draft.yarn.name ?? ''}
              onChange={(e) => setYarn({ name: e.target.value })}
              placeholder="e.g. Rios"
            />
          </label>
        </div>
        <label>
          Fiber composition <span className="req">*</span>
          <input
            value={draft.yarn.fiber}
            onChange={(e) => setYarn({ fiber: e.target.value })}
            placeholder="e.g. 100% merino, 80/20 wool/nylon"
          />
        </label>
        <div className="grid-3">
          <label>
            Weight
            <select
              value={draft.yarn.weightCategory ?? ''}
              onChange={(e) =>
                setYarn({
                  weightCategory:
                    (e.target.value as WeightCategory) || undefined,
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
            Yds / gram
            <input
              type="number"
              step="0.1"
              min="0"
              value={draft.yarn.ydsPerGram ?? ''}
              onChange={(e) => setYarn({ ydsPerGram: numOrUndef(e.target.value) })}
            />
          </label>
          <label>
            WPI
            <input
              type="number"
              step="1"
              min="0"
              value={draft.yarn.wpi ?? ''}
              onChange={(e) => setYarn({ wpi: numOrUndef(e.target.value) })}
            />
          </label>
        </div>
        <label className="narrow">
          Plies
          <input
            type="number"
            step="1"
            min="0"
            value={draft.yarn.plies ?? ''}
            onChange={(e) => setYarn({ plies: numOrUndef(e.target.value) })}
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Tools &amp; technique</legend>
        <div className="grid-2">
          <label>
            Needle size (mm) <span className="req">*</span>
            <input
              type="number"
              step="0.25"
              min="0"
              value={draft.needleSizeMm}
              onChange={(e) =>
                setDraft((d) => ({ ...d, needleSizeMm: Number(e.target.value) }))
              }
            />
          </label>
          <label>
            Needle material
            <select
              value={draft.needleMaterial}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  needleMaterial: e.target.value as NeedleMaterial,
                }))
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
            Stitch pattern
            <select
              value={draft.stitchPattern}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  stitchPattern: e.target.value as StitchPattern,
                }))
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
              value={draft.construction}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  construction: e.target.value as Construction,
                }))
              }
            >
              {CONSTRUCTIONS.map((c) => (
                <option key={c} value={c}>
                  {label(c)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Measured gauge (per 10cm)</legend>
        <div className="grid-2">
          <label>
            Stitches <span className="req">*</span>
            <input
              type="number"
              step="0.5"
              min="0"
              value={draft.stitchesPer10cm || ''}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  stitchesPer10cm: Number(e.target.value),
                }))
              }
            />
          </label>
          <label>
            Rows <span className="req">*</span>
            <input
              type="number"
              step="0.5"
              min="0"
              value={draft.rowsPer10cm || ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, rowsPer10cm: Number(e.target.value) }))
              }
            />
          </label>
        </div>
        <div className="checkboxes">
          <label className="inline">
            <input
              type="checkbox"
              checked={draft.blocked}
              onChange={(e) =>
                setDraft((d) => ({ ...d, blocked: e.target.checked }))
              }
            />
            Blocked
          </label>
          <label className="inline">
            <input
              type="checkbox"
              checked={draft.washed}
              onChange={(e) =>
                setDraft((d) => ({ ...d, washed: e.target.checked }))
              }
            />
            Washed
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Notes</legend>
        <label>
          Project
          <input
            value={draft.project ?? ''}
            onChange={(e) =>
              setDraft((d) => ({ ...d, project: e.target.value }))
            }
            placeholder="e.g. blue cardigan"
          />
        </label>
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

      <button type="submit" className="btn primary">
        Save swatch
      </button>
    </form>
  )
}
