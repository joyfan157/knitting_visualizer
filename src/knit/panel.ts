// A flat knitted panel modeled as a stitch graph. A panel is worked row by row;
// each row has a stitch count, and edge increases/decreases change that count
// between rows — which is exactly how flat patterns shape a piece. See SPEC.md
// "Flat panel stitch graph".

export type Preset = 'rectangle' | 'widen' | 'narrow' | 'diamond'

export interface PanelParams {
  preset: Preset
  /** Stitches cast on for the first row. */
  castOn: number
  /** Rows worked after the cast-on row. */
  rows: number
  /** Stitches added/removed at EACH side on a shaping row. */
  perSide: number
  /** Shape every `interval` rows (e.g. 2 = every other row). */
  interval: number
}

/** Expand params to a stitch count per row (index 0 = cast-on row, upward). */
export function buildCounts(p: PanelParams): number[] {
  const castOn = Math.max(1, Math.round(p.castOn))
  const rows = Math.max(0, Math.round(p.rows))
  const interval = Math.max(1, Math.round(p.interval))
  const step = 2 * Math.max(0, Math.round(p.perSide)) // both sides
  const mid = Math.floor(rows / 2)

  const counts = [castOn]
  let cur = castOn
  for (let r = 1; r <= rows; r++) {
    let delta = 0
    if (step > 0 && r % interval === 0) {
      if (p.preset === 'widen') delta = step
      else if (p.preset === 'narrow') delta = -step
      else if (p.preset === 'diamond') delta = r <= mid ? step : -step
      // rectangle: no shaping
    }
    cur = Math.max(1, cur + delta)
    counts.push(cur)
  }
  return counts
}

export interface PanelGraph {
  counts: number[]
  offsets: number[] // global index of the first stitch in each row
  nodeCount: number
  edges: Array<[number, number]> // row-neighbor + column (to row below) edges
}

/** Build the stitch graph: nodes per stitch, edges within a row and to the row
 *  below (column edges follow center alignment, so shaping maps to the nearest
 *  parent stitch). */
export function buildPanel(counts: number[]): PanelGraph {
  const offsets: number[] = []
  let off = 0
  for (const n of counts) {
    offsets.push(off)
    off += n
  }
  const g = (r: number, c: number) => offsets[r] + c
  const edges: Array<[number, number]> = []
  for (let r = 0; r < counts.length; r++) {
    const n = counts[r]
    for (let c = 0; c < n - 1; c++) edges.push([g(r, c), g(r, c + 1)])
    if (r > 0) {
      const nb = counts[r - 1]
      for (let c = 0; c < n; c++) {
        // center-aligned parent in the row below
        const rel = c - (n - 1) / 2
        const pc = Math.max(0, Math.min(nb - 1, Math.round(rel + (nb - 1) / 2)))
        edges.push([g(r, c), g(r - 1, pc)])
      }
    }
  }
  return { counts, offsets, nodeCount: off, edges }
}

export interface Gauge {
  stitchesPer10cm: number
  rowsPer10cm: number
}

export interface PanelLayout {
  x: Float32Array
  y: Float32Array
  widthCm: number
  heightCm: number
  totalStitches: number
  maxStitches: number
}

/** Lay the graph out flat in centimeters using gauge; rows centered on x=0. */
export function layoutPanel(graph: PanelGraph, gauge: Gauge): PanelLayout {
  const sw = 10 / Math.max(1, gauge.stitchesPer10cm)
  const rh = 10 / Math.max(1, gauge.rowsPer10cm)
  const x = new Float32Array(graph.nodeCount)
  const y = new Float32Array(graph.nodeCount)
  let maxStitches = 0
  let total = 0
  for (let r = 0; r < graph.counts.length; r++) {
    const n = graph.counts[r]
    maxStitches = Math.max(maxStitches, n)
    total += n
    for (let c = 0; c < n; c++) {
      const i = graph.offsets[r] + c
      x[i] = (c - (n - 1) / 2) * sw
      y[i] = r * rh
    }
  }
  return {
    x,
    y,
    widthCm: maxStitches * sw,
    heightCm: Math.max(0, graph.counts.length - 1) * rh,
    totalStitches: total,
    maxStitches,
  }
}
