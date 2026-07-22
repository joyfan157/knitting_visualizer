import { useMemo, useState } from 'react'
import type { Swatch } from '../types'
import {
  buildCounts,
  buildPanel,
  layoutPanel,
  type Preset,
} from '../knit/panel'
import { NumberInput } from './NumberInput'
import { PanelViewer } from './PanelViewer'

const PRESETS: { value: Preset; label: string; hint: string }[] = [
  { value: 'rectangle', label: 'Rectangle', hint: 'no shaping — a plain panel' },
  { value: 'widen', label: 'Widen', hint: 'increase at both edges (e.g. sleeve)' },
  { value: 'narrow', label: 'Narrow', hint: 'decrease at both edges' },
  { value: 'diamond', label: 'Diamond', hint: 'widen then narrow' },
]

function swatchLabel(s: Swatch): string {
  const p = s.project?.trim() || 'swatch'
  return `${p} — ${s.needleSizeMm}mm (${s.stitchesPer10cm}×${s.rowsPer10cm})`
}

export function KnitStudio({ swatches }: { swatches: Swatch[] }) {
  const [preset, setPreset] = useState<Preset>('rectangle')
  const [castOn, setCastOn] = useState(30)
  const [rows, setRows] = useState(40)
  const [perSide, setPerSide] = useState(1)
  const [interval, setInterval] = useState(2)
  const [sts10, setSts10] = useState(20)
  const [rows10, setRows10] = useState(28)

  const shaped = preset !== 'rectangle'

  const { graph, layout } = useMemo(() => {
    const counts = buildCounts({ preset, castOn, rows, perSide, interval })
    const g = buildPanel(counts)
    return { graph: g, layout: layoutPanel(g, { stitchesPer10cm: sts10, rowsPer10cm: rows10 }) }
  }, [preset, castOn, rows, perSide, interval, sts10, rows10])

  function applySwatchGauge(id: string) {
    const s = swatches.find((sw) => sw.id === id)
    if (!s) return
    setSts10(s.stitchesPer10cm)
    setRows10(s.rowsPer10cm)
  }

  return (
    <div className="columns">
      <section className="panel">
        <h2>Flat panel</h2>
        <p className="muted studio-intro">
          A knitted piece starts flat: stitches in rows, shaped by edge
          increases/decreases. This is the stitch graph — later, panels get
          seamed and stuffed into a 3D shape.
        </p>

        <fieldset>
          <legend>Shape</legend>
          <label>
            Preset
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as Preset)}
            >
              {PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label} — {p.hint}
                </option>
              ))}
            </select>
          </label>
          <div className="grid-2">
            <label>
              Cast on (stitches)
              <NumberInput
                value={castOn}
                onChange={(v) => setCastOn(v && v >= 1 ? Math.round(v) : 1)}
              />
            </label>
            <label>
              Rows
              <NumberInput
                value={rows}
                onChange={(v) => setRows(v && v >= 0 ? Math.round(v) : 0)}
              />
            </label>
          </div>
          <div className="grid-2">
            <label className={shaped ? '' : 'disabled-field'}>
              Sts each side / shaping row
              <NumberInput
                value={perSide}
                onChange={(v) => setPerSide(v && v >= 0 ? Math.round(v) : 0)}
              />
            </label>
            <label className={shaped ? '' : 'disabled-field'}>
              Shape every … rows
              <NumberInput
                value={interval}
                onChange={(v) => setInterval(v && v >= 1 ? Math.round(v) : 1)}
              />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Gauge (per 10cm)</legend>
          <div className="grid-2">
            <label>
              Stitches
              <NumberInput value={sts10} onChange={(v) => setSts10(v || 1)} />
            </label>
            <label>
              Rows
              <NumberInput value={rows10} onChange={(v) => setRows10(v || 1)} />
            </label>
          </div>
          {swatches.length > 0 && (
            <label>
              Use gauge from a swatch
              <select
                value=""
                onChange={(e) => e.target.value && applySwatchGauge(e.target.value)}
              >
                <option value="">— pick a swatch —</option>
                {swatches.map((s) => (
                  <option key={s.id} value={s.id}>
                    {swatchLabel(s)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </fieldset>

        <div className="dims">
          <span>
            <strong>{layout.widthCm.toFixed(1)}</strong> cm wide
          </span>
          <span>
            <strong>{layout.heightCm.toFixed(1)}</strong> cm tall
          </span>
          <span>
            <strong>{layout.totalStitches.toLocaleString()}</strong> stitches
          </span>
        </div>
      </section>

      <section className="panel">
        <h2>Stitch graph</h2>
        <PanelViewer graph={graph} layout={layout} />
        <p className="muted viewer-caption">
          Each dot is a stitch; lines are neighbors in the row and the stitch
          below. Width is drawn to your gauge.
        </p>
      </section>
    </div>
  )
}
