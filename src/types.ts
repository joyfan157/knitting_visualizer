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

export interface Yarn {
  brand?: string
  name?: string
  /** Free text, e.g. "100% merino", "80/20 wool/nylon". Required. */
  fiber: string
  weightCategory?: WeightCategory
  /** Grist option 1: yards per gram. */
  ydsPerGram?: number
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
  /** Measured gauge over a 10cm span. */
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
