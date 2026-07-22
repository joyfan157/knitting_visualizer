import type { Swatch, Yarn, Measurement, FiberCategory } from './types'

// Normalizes stored/imported records into the current Swatch shape so data
// written by older versions keeps working. Older records had a single `yarn`
// with a required `fiber` string (no category), a `washed` field, and — in the
// very first version — no `measurement` object.

const FIBER_CATEGORY_VALUES: FiberCategory[] = [
  'animal',
  'plant',
  'synthetic',
  'blend',
  'unknown',
]

function normalizeYarn(raw: unknown): Yarn {
  const y = (raw ?? {}) as Record<string, unknown>
  const category = y.fiberCategory
  const fiberCategory: FiberCategory =
    typeof category === 'string' &&
    FIBER_CATEGORY_VALUES.includes(category as FiberCategory)
      ? (category as FiberCategory)
      : 'unknown'
  const strands = y.strands
  return {
    brand: y.brand as string | undefined,
    name: y.name as string | undefined,
    fiberCategory,
    strands: typeof strands === 'number' && strands >= 1 ? Math.round(strands) : 1,
    fiber: (y.fiber as string) || undefined,
    weightCategory: y.weightCategory as Yarn['weightCategory'],
    metersPerGram: y.metersPerGram as number | undefined,
    wpi: y.wpi as number | undefined,
    plies: y.plies as number | undefined,
  }
}

function normalizeMeasurement(raw: Record<string, unknown>): Measurement {
  const m = raw.measurement as Measurement | undefined
  if (m && (m.method === 'gauge-span' || m.method === 'full-swatch')) return m
  // Very old record: reconstruct a gauge-span from the stored per-10cm values.
  return {
    method: 'gauge-span',
    stitchCount: (raw.stitchesPer10cm as number) ?? 0,
    rowCount: (raw.rowsPer10cm as number) ?? 0,
    span: 10,
    unit: 'cm',
  }
}

export function normalizeSwatch(raw: unknown): Swatch {
  const s = (raw ?? {}) as Record<string, unknown>
  const yarns: Yarn[] = Array.isArray(s.yarns)
    ? s.yarns.map(normalizeYarn)
    : [normalizeYarn(s.yarn)]
  return {
    id: s.id as string,
    createdAt: s.createdAt as string,
    yarns: yarns.length ? yarns : [normalizeYarn(undefined)],
    needleSizeMm: (s.needleSizeMm as number) ?? 0,
    needleMaterial: (s.needleMaterial as Swatch['needleMaterial']) ?? 'metal',
    stitchPattern: (s.stitchPattern as Swatch['stitchPattern']) ?? 'stockinette',
    construction: (s.construction as Swatch['construction']) ?? 'flat',
    measurement: normalizeMeasurement(s),
    stitchesPer10cm: (s.stitchesPer10cm as number) ?? 0,
    rowsPer10cm: (s.rowsPer10cm as number) ?? 0,
    blocked: !!s.blocked,
    project: s.project as string | undefined,
    notes: s.notes as string | undefined,
  }
}
