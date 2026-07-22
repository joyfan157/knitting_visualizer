import type {
  Swatch,
  Yarn,
  StitchPattern,
  Construction,
  FiberCategory,
} from './types'

// Gauge prediction = a function from (needle, pattern, fiber, …) to a predicted
// gauge with an uncertainty range. It blends a physics baseline with the
// knitter's own swatches. See SPEC.md "Prediction approach".

// --- Physics baseline ---
// Stitch width scales roughly with needle diameter. Knit stitches are wider than
// tall, so row height < stitch width (=> more rows than stitches per 10cm).
// Calibrated 2026-07-22 against Joy's first 11 swatches (stockinette): median
// implied factors were ~1.05 (width) and ~0.72 (height) — she knits noticeably
// denser vertically than generic charts assume. Re-fit as more data accrues.
const STITCH_WIDTH_FACTOR = 1.05 // mm of stitch width per mm of needle
const ROW_HEIGHT_FACTOR = 0.72 // mm of row height per mm of needle

// How vague the physics prior is, as a fraction of its own value (~15%).
const PRIOR_VAGUENESS = 0.15
// Weight of the physics prior, in "pseudo-swatches". 1 ≈ trust it like a single
// real, perfectly-matching swatch.
const PRIOR_STRENGTH = 1.0
// Needle-distance falloff (mm). Swatches within ~this many mm count strongly.
const NEEDLE_SCALE = 0.75

export interface PredictionInput {
  needleSizeMm: number
  stitchPattern: StitchPattern
  construction: Construction
  /** Fiber category of each strand held together. Length = strand count. */
  fiberCategories: FiberCategory[]
}

export interface GaugeEstimate {
  value: number
  low: number
  high: number
}

export interface GaugePrediction {
  stitchesPer10cm: GaugeEstimate
  rowsPer10cm: GaugeEstimate
  /** Where the estimate mostly comes from. */
  basis: 'physics' | 'blended' | 'data'
  /** How many of the knitter's swatches contributed meaningfully. */
  matchCount: number
}

function physicsBaseline(needleSizeMm: number) {
  return {
    stitchesPer10cm: 100 / (STITCH_WIDTH_FACTOR * needleSizeMm),
    rowsPer10cm: 100 / (ROW_HEIGHT_FACTOR * needleSizeMm),
  }
}

/** Expand yarns into one category per physical strand (doubled yarn -> two). */
function expandCategories(yarns: Yarn[]): FiberCategory[] {
  return yarns.flatMap((y) =>
    Array(Math.max(1, y.strands)).fill(y.fiberCategory),
  )
}

/** Held-strand count strongly affects gauge, so weight it steeply. */
function strandCountFactor(a: number, b: number): number {
  const d = Math.abs(a - b)
  return d === 0 ? 1 : d === 1 ? 0.4 : 0.15
}

/**
 * Fiber similarity by category. 'unknown' is treated as "no constraint" and
 * ignored on both sides. If the query has no known categories, stay neutral.
 */
function fiberFactor(
  queryCats: FiberCategory[],
  swatchCats: FiberCategory[],
): number {
  const q = queryCats.filter((c) => c !== 'unknown')
  if (q.length === 0) return 0.7
  const pool = swatchCats.filter((c) => c !== 'unknown')
  let hits = 0
  for (const c of q) {
    const i = pool.indexOf(c)
    if (i >= 0) {
      hits++
      pool.splice(i, 1)
    }
  }
  return 0.4 + 0.6 * (hits / q.length)
}

/**
 * Similarity weight of an existing swatch to the query. Product of independent
 * factors, each in (0, 1]. Needle distance is a Gaussian falloff; the others are
 * soft matches so a mismatch downweights rather than disqualifies.
 */
function similarity(s: Swatch, input: PredictionInput): number {
  const dNeedle = Math.abs(s.needleSizeMm - input.needleSizeMm)
  const wNeedle = Math.exp(-((dNeedle / NEEDLE_SCALE) ** 2))
  const wPattern = s.stitchPattern === input.stitchPattern ? 1 : 0.2
  const wConstruction = s.construction === input.construction ? 1 : 0.7

  const swatchCats = expandCategories(s.yarns)
  const wStrands = strandCountFactor(
    input.fiberCategories.length,
    swatchCats.length,
  )
  const wFiber = fiberFactor(input.fiberCategories, swatchCats)

  return wNeedle * wPattern * wConstruction * wStrands * wFiber
}

export function predictGauge(
  input: PredictionInput,
  swatches: Swatch[],
): GaugePrediction {
  const baseline = physicsBaseline(input.needleSizeMm)

  const weighted = swatches
    .map((s) => ({ s, weight: similarity(s, input) }))
    .filter((x) => x.weight > 0.05)

  const sumW = weighted.reduce((acc, x) => acc + x.weight, 0)
  const effN = sumW + PRIOR_STRENGTH

  // Bayesian-flavored blend of the knitter's swatches with the physics prior,
  // plus a standard-error band that widens with little/scattered data.
  function blend(pick: (s: Swatch) => number, base: number): GaugeEstimate {
    const dataSum = weighted.reduce((acc, x) => acc + x.weight * pick(x.s), 0)
    const value = (dataSum + PRIOR_STRENGTH * base) / effN

    let varAcc = 0
    for (const x of weighted) varAcc += x.weight * (pick(x.s) - value) ** 2
    const priorVar = (base * PRIOR_VAGUENESS) ** 2
    const pooledVar = (varAcc + PRIOR_STRENGTH * priorVar) / effN
    const stdErr = Math.sqrt(pooledVar / effN)

    const band = Math.max(1.5 * stdErr, base * 0.03)
    return { value, low: value - band, high: value + band }
  }

  const basis: GaugePrediction['basis'] =
    sumW < 0.5 ? 'physics' : sumW < 3 ? 'blended' : 'data'

  const round1 = (n: number) => Math.round(n * 10) / 10
  const shape = (g: GaugeEstimate): GaugeEstimate => ({
    value: round1(g.value),
    low: round1(g.low),
    high: round1(g.high),
  })

  return {
    stitchesPer10cm: shape(blend((s) => s.stitchesPer10cm, baseline.stitchesPer10cm)),
    rowsPer10cm: shape(blend((s) => s.rowsPer10cm, baseline.rowsPer10cm)),
    basis,
    matchCount: weighted.length,
  }
}
