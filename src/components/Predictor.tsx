import { useState } from 'react'
import type { Swatch, StitchPattern, Construction } from '../types'
import { STITCH_PATTERNS, CONSTRUCTIONS, label } from '../types'
import { predictGauge, type GaugeEstimate } from '../prediction'
import { NumberInput } from './NumberInput'

const BASIS_NOTE: Record<string, string> = {
  physics:
    'Physics estimate only — log swatches like this to personalize it.',
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
  const [construction, setConstruction] = useState<Construction>('in-the-round')
  const [fiber, setFiber] = useState('')

  const prediction = needleSizeMm
    ? predictGauge({ needleSizeMm, stitchPattern, construction, fiber }, swatches)
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
          Fiber (optional)
          <input
            value={fiber}
            onChange={(e) => setFiber(e.target.value)}
            placeholder="e.g. 100% merino"
          />
        </label>
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
