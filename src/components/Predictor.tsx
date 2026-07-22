import { useState } from 'react'
import type {
  Swatch,
  StitchPattern,
  Construction,
  FiberCategory,
  WeightCategory,
} from '../types'
import {
  STITCH_PATTERNS,
  CONSTRUCTIONS,
  FIBER_CATEGORIES,
  WEIGHT_CATEGORIES,
  label,
} from '../types'
import { predictGauge, type GaugeEstimate } from '../prediction'
import { NumberInput } from './NumberInput'

const BASIS_NOTE: Record<string, string> = {
  physics: 'Physics estimate only — log swatches like this to personalize it.',
  blended: 'Blending your swatches with the physics baseline.',
  data: 'Based mostly on your own swatches.',
}

function EstimateRow({ label: name, est }: { label: string; est: GaugeEstimate }) {
  return (
    <div className="estimate">
      <span className="estimate-label">{name}</span>
      <span className="estimate-value">{est.value}</span>
      <span className="estimate-range">
        ({est.low}–{est.high})
      </span>
    </div>
  )
}

export function Predictor({ swatches }: { swatches: Swatch[] }) {
  const [needleSizeMm, setNeedle] = useState<number | undefined>(undefined)
  const [stitchPattern, setPattern] = useState<StitchPattern>('stockinette')
  const [construction, setConstruction] = useState<Construction>('flat')
  const [fiberCategories, setFiberCategories] = useState<FiberCategory[]>([
    'unknown',
  ])
  const [blocked, setBlocked] = useState(true)
  const [weightCategory, setWeightCategory] = useState<WeightCategory | ''>('')

  function setStrandCat(index: number, value: FiberCategory) {
    setFiberCategories((cats) => cats.map((c, i) => (i === index ? value : c)))
  }
  function addStrand() {
    setFiberCategories((cats) => [...cats, 'unknown'])
  }
  function removeStrand(index: number) {
    setFiberCategories((cats) =>
      cats.length > 1 ? cats.filter((_, i) => i !== index) : cats,
    )
  }

  const prediction = needleSizeMm
    ? predictGauge(
        {
          needleSizeMm,
          stitchPattern,
          construction,
          fiberCategories,
          blocked,
          weightCategory: weightCategory || undefined,
        },
        swatches,
      )
    : null

  return (
    <div className="predictor">
      <div className="grid-2">
        <label>
          Needle size (mm)
          <NumberInput
            value={needleSizeMm}
            onChange={setNeedle}
            placeholder="e.g. 3.75"
          />
        </label>
        <label>
          Stitch pattern
          <select
            value={stitchPattern}
            onChange={(e) => setPattern(e.target.value as StitchPattern)}
          >
            {STITCH_PATTERNS.map((p) => (
              <option key={p} value={p}>
                {label(p)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid-2">
        <label>
          Construction
          <select
            value={construction}
            onChange={(e) => setConstruction(e.target.value as Construction)}
          >
            {CONSTRUCTIONS.map((c) => (
              <option key={c} value={c}>
                {label(c)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Yarn weight (optional)
          <select
            value={weightCategory}
            onChange={(e) =>
              setWeightCategory(e.target.value as WeightCategory | '')
            }
          >
            <option value="">— any —</option>
            {WEIGHT_CATEGORIES.map((w) => (
              <option key={w} value={w}>
                {label(w)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="inline">
        <input
          type="checkbox"
          checked={blocked}
          onChange={(e) => setBlocked(e.target.checked)}
        />
        Blocked
      </label>

      <div className="predictor-strands">
        <span className="field-label">
          Strand{fiberCategories.length > 1 ? 's held together' : ''}
        </span>
        {fiberCategories.map((cat, i) => (
          <div className="strand-row" key={i}>
            <select
              value={cat}
              onChange={(e) => setStrandCat(i, e.target.value as FiberCategory)}
            >
              {FIBER_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {label(c)}
                </option>
              ))}
            </select>
            {fiberCategories.length > 1 && (
              <button
                type="button"
                className="btn danger small"
                onClick={() => removeStrand(i)}
                title="Remove strand"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn small" onClick={addStrand}>
          + Add strand
        </button>
      </div>

      {prediction ? (
        <div className={`prediction-card basis-${prediction.basis}`}>
          <EstimateRow label="sts / 10cm" est={prediction.stitchesPer10cm} />
          <EstimateRow label="rows / 10cm" est={prediction.rowsPer10cm} />
          <p className="basis-note">
            {BASIS_NOTE[prediction.basis]}
            {prediction.matchCount > 0 && (
              <>
                {' '}
                <span className="muted">
                  ({prediction.matchCount} similar swatch
                  {prediction.matchCount === 1 ? '' : 'es'})
                </span>
              </>
            )}
          </p>
        </div>
      ) : (
        <p className="muted prediction-hint">
          Enter a needle size to see a predicted gauge.
        </p>
      )}
    </div>
  )
}
