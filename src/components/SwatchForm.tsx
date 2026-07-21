import { useState, type FormEvent } from 'react'
import type {
  Swatch,
  Yarn,
  WeightCategory,
  StitchPattern,
  Construction,
  NeedleMaterial,
  Measurement,
  MeasurementMethod,
  LengthUnit,
  GaugeSpanMeasurement,
  FullSwatchMeasurement,
} from '../types'
import {
  WEIGHT_CATEGORIES,
  STITCH_PATTERNS,
  CONSTRUCTIONS,
  NEEDLE_MATERIALS,
  label,
} from '../types'
import { newSwatchDraft } from '../defaults'
import { derivePer10cm } from '../gauge'
import { NumberInput } from './NumberInput'

const round1 = (n: number) => Math.round(n * 10) / 10

export function SwatchForm({
  onSave,
}: {
  onSave: (s: Swatch) => void | Promise<void>
}) {
  const [draft, setDraft] = useState(newSwatchDraft())

  function setYarn(patch: Partial<Yarn>) {
    setDraft((d) => ({ ...d, yarn: { ...d.yarn, ...patch } }))
  }

  const measurement = draft.measurement
  const preview = derivePer10cm(measurement)

  function updateSpan(patch: Partial<GaugeSpanMeasurement>) {
    setDraft((d) => ({
      ...d,
      measurement: { ...(d.measurement as GaugeSpanMeasurement), ...patch },
    }))
  }

  function updateFull(patch: Partial<FullSwatchMeasurement>) {
    setDraft((d) => ({
      ...d,
      measurement: { ...(d.measurement as FullSwatchMeasurement), ...patch },
    }))
  }

  function setMethod(method: MeasurementMethod) {
    setDraft((d) => {
      if (d.measurement.method === method) return d
      const unit = d.measurement.unit
      const next: Measurement =
        method === 'gauge-span'
          ? { method, stitchCount: 0, rowCount: 0, span: unit === 'in' ? 4 : 10, unit }
          : {
              method,
              castOnStitches: 0,
              totalRows: 0,
              measuredWidth: 0,
              measuredHeight: 0,
              unit,
            }
      return { ...d, measurement: next }
    })
  }

  function setUnit(unit: LengthUnit) {
    setDraft((d) => ({ ...d, measurement: { ...d.measurement, unit } }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft.yarn.fiber.trim()) {
      alert('Fiber composition is required.')
      return
    }
    if (!draft.needleSizeMm) {
      alert('Enter a needle size.')
      return
    }
    const { stitchesPer10cm, rowsPer10cm } = derivePer10cm(draft.measurement)
    if (!stitchesPer10cm || !rowsPer10cm) {
      alert('Enter your swatch measurements.')
      return
    }
    const swatch: Swatch = {
      ...draft,
      stitchesPer10cm: round1(stitchesPer10cm),
      rowsPer10cm: round1(rowsPer10cm),
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
            m / gram
            <NumberInput
              value={draft.yarn.metersPerGram}
              onChange={(v) => setYarn({ metersPerGram: v })}
            />
          </label>
          <label>
            WPI
            <NumberInput
              value={draft.yarn.wpi}
              onChange={(v) => setYarn({ wpi: v })}
            />
          </label>
        </div>
        <label className="narrow">
          Plies
          <NumberInput
            value={draft.yarn.plies}
            onChange={(v) => setYarn({ plies: v })}
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Tools &amp; technique</legend>
        <div className="grid-2">
          <label>
            Needle size (mm) <span className="req">*</span>
            <NumberInput
              value={draft.needleSizeMm || undefined}
              onChange={(v) =>
                setDraft((d) => ({ ...d, needleSizeMm: v ?? 0 }))
              }
              placeholder="e.g. 3.75"
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
        <legend>Measured gauge</legend>
        <div className="grid-2">
          <label>
            How measured
            <select
              value={measurement.method}
              onChange={(e) => setMethod(e.target.value as MeasurementMethod)}
            >
              <option value="gauge-span">Count over a swatch window</option>
              <option value="full-swatch">Made-to-measure whole swatch</option>
            </select>
          </label>
          <label>
            Units
            <select
              value={measurement.unit}
              onChange={(e) => setUnit(e.target.value as LengthUnit)}
            >
              <option value="cm">centimeters</option>
              <option value="in">inches</option>
            </select>
          </label>
        </div>

        {measurement.method === 'gauge-span' ? (
          <div className="grid-3">
            <label>
              Stitches counted <span className="req">*</span>
              <NumberInput
                value={measurement.stitchCount || undefined}
                onChange={(v) => updateSpan({ stitchCount: v ?? 0 })}
              />
            </label>
            <label>
              Rows counted <span className="req">*</span>
              <NumberInput
                value={measurement.rowCount || undefined}
                onChange={(v) => updateSpan({ rowCount: v ?? 0 })}
              />
            </label>
            <label>
              Over ({measurement.unit}) <span className="req">*</span>
              <NumberInput
                value={measurement.span || undefined}
                onChange={(v) => updateSpan({ span: v ?? 0 })}
              />
            </label>
          </div>
        ) : (
          <>
            <div className="grid-2">
              <label>
                Stitches cast on <span className="req">*</span>
                <NumberInput
                  value={measurement.castOnStitches || undefined}
                  onChange={(v) => updateFull({ castOnStitches: v ?? 0 })}
                />
              </label>
              <label>
                Rows knit <span className="req">*</span>
                <NumberInput
                  value={measurement.totalRows || undefined}
                  onChange={(v) => updateFull({ totalRows: v ?? 0 })}
                />
              </label>
            </div>
            <div className="grid-2">
              <label>
                Measured width ({measurement.unit}) <span className="req">*</span>
                <NumberInput
                  value={measurement.measuredWidth || undefined}
                  onChange={(v) => updateFull({ measuredWidth: v ?? 0 })}
                />
              </label>
              <label>
                Measured height ({measurement.unit}){' '}
                <span className="req">*</span>
                <NumberInput
                  value={measurement.measuredHeight || undefined}
                  onChange={(v) => updateFull({ measuredHeight: v ?? 0 })}
                />
              </label>
            </div>
          </>
        )}

        <p className="gauge-preview">
          → <strong>{round1(preview.stitchesPer10cm)}</strong> sts ×{' '}
          <strong>{round1(preview.rowsPer10cm)}</strong> rows / 10&nbsp;cm
          {measurement.unit === 'in' && (
            <span className="muted"> &nbsp;(converted from inches)</span>
          )}
        </p>

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
