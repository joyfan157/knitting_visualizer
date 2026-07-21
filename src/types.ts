// Core data model for the gauge journal. See SPEC.md for rationale.

export type WeightCategory =
  | 'lace'
  | 'fingering'
  | 'sport'
  | 'dk'
  | 'worsted'
  | 'aran'
  | 'bulky'
  | 'super-bulky'

export type StitchPattern =
  | 'stockinette'
  | 'garter'
  | 'rib-1x1'
  | 'rib-2x2'
  | 'seed'
  | 'cable'
  | 'other'

export type Construction = 'flat' | 'in-the-round'

export type NeedleMaterial = 'metal' | 'wood' | 'bamboo' | 'other'

export type LengthUnit = 'cm' | 'in'

export type MeasurementMethod = 'gauge-span' | 'full-swatch'

/** Count stitches & rows over a measured square window (e.g. "22 sts over 10cm"). */
export interface GaugeSpanMeasurement {
  method: 'gauge-span'
  stitchCount: number
  rowCount: number
  /** Size of the measured window; same span used for width and height. */
  span: number
  unit: LengthUnit
}

/** Made-to-measure: cast on a known count, knit known rows, measure the piece. */
export interface FullSwatchMeasurement {
  method: 'full-swatch'
  castOnStitches: number
  totalRows: number
  measuredWidth: number
  measuredHeight: number
  unit: LengthUnit
}

export type Measurement = GaugeSpanMeasurement | FullSwatchMeasurement

export interface Yarn {
  brand?: string
  name?: string
  /** Free text, e.g. "100% merino", "80/20 wool/nylon". Required. */
  fiber: string
  weightCategory?: WeightCategory
  /** Grist option 1: meters per gram (the standard yarn-label figure). */
  metersPerGram?: number
  /** Grist option 2: wraps per inch. */
  wpi?: number
  plies?: number
}

export interface Swatch {
  id: string
  /** ISO timestamp. */
  createdAt: string
  yarn: Yarn
  needleSizeMm: number
  needleMaterial: NeedleMaterial
  stitchPattern: StitchPattern
  construction: Construction
  /** How the gauge was measured (window count or made-to-measure). */
  measurement: Measurement
  /** Canonical gauge over a 10cm span, derived from `measurement` at save time. */
  stitchesPer10cm: number
  rowsPer10cm: number
  blocked: boolean
  washed: boolean
  project?: string
  notes?: string
}

// --- Option lists for form controls ---

export const WEIGHT_CATEGORIES: WeightCategory[] = [
  'lace',
  'fingering',
  'sport',
  'dk',
  'worsted',
  'aran',
  'bulky',
  'super-bulky',
]

export const STITCH_PATTERNS: StitchPattern[] = [
  'stockinette',
  'garter',
  'rib-1x1',
  'rib-2x2',
  'seed',
  'cable',
  'other',
]

export const CONSTRUCTIONS: Construction[] = ['flat', 'in-the-round']

export const NEEDLE_MATERIALS: NeedleMaterial[] = ['metal', 'wood', 'bamboo', 'other']

const LABELS: Record<string, string> = {
  // stitch patterns
  stockinette: 'Stockinette',
  garter: 'Garter',
  'rib-1x1': '1×1 Rib',
  'rib-2x2': '2×2 Rib',
  seed: 'Seed',
  cable: 'Cable',
  other: 'Other',
  // construction
  flat: 'Flat',
  'in-the-round': 'In the round',
  // needle material
  metal: 'Metal',
  wood: 'Wood',
  bamboo: 'Bamboo',
  // weight categories
  lace: 'Lace',
  fingering: 'Fingering',
  sport: 'Sport',
  dk: 'DK',
  worsted: 'Worsted',
  aran: 'Aran',
  bulky: 'Bulky',
  'super-bulky': 'Super Bulky',
}

/** Human-friendly label for an enum value; falls back to the raw key. */
export function label(key: string): string {
  return LABELS[key] ?? key
}
