import type {
  Swatch,
  Yarn,
  Measurement,
  MeasurementMethod,
  LengthUnit,
  NeedleMaterial,
  StitchPattern,
  Construction,
} from './types'
import { newYarn } from './defaults'
import { derivePer10cm } from './gauge'

// An "entry" is the form's unit of work: one shared yarn + technique, with one
// or more gauge-swatch *attempts* (e.g. the same yarn tried on several needle
// sizes to meet gauge). On save each attempt becomes its own independent Swatch.

/** Raw measurement numbers for one attempt; combined with the entry's shared
 *  method + unit to form a Measurement. Both method's fields are kept so
 *  switching method doesn't lose what was typed. */
export interface AttemptMeasure {
  stitchCount: number
  rowCount: number
  span: number
  castOnStitches: number
  totalRows: number
  measuredWidth: number
  measuredHeight: number
}

export interface Attempt {
  needleSizeMm: number
  blocked: boolean
  measure: AttemptMeasure
}

export interface EntryDraft {
  yarns: Yarn[]
  needleMaterial: NeedleMaterial
  stitchPattern: StitchPattern
  construction: Construction
  measurementMethod: MeasurementMethod
  measurementUnit: LengthUnit
  project?: string
  notes?: string
  attempts: Attempt[]
}

function emptyMeasure(unit: LengthUnit): AttemptMeasure {
  return {
    stitchCount: 0,
    rowCount: 0,
    span: unit === 'in' ? 4 : 10,
    castOnStitches: 0,
    totalRows: 0,
    measuredWidth: 0,
    measuredHeight: 0,
  }
}

export function newAttempt(unit: LengthUnit): Attempt {
  return { needleSizeMm: 0, blocked: true, measure: emptyMeasure(unit) }
}

export function newEntryDraft(): EntryDraft {
  return {
    yarns: [newYarn()],
    needleMaterial: 'metal',
    stitchPattern: 'stockinette',
    construction: 'flat',
    measurementMethod: 'gauge-span',
    measurementUnit: 'cm',
    project: '',
    notes: '',
    attempts: [newAttempt('cm')],
  }
}

/** Combine the entry's shared method/unit with an attempt's numbers. */
export function attemptMeasurement(draft: EntryDraft, a: Attempt): Measurement {
  const method = draft.measurementMethod
  const unit = draft.measurementUnit
  const m = a.measure
  return method === 'gauge-span'
    ? { method, unit, stitchCount: m.stitchCount, rowCount: m.rowCount, span: m.span }
    : {
        method,
        unit,
        castOnStitches: m.castOnStitches,
        totalRows: m.totalRows,
        measuredWidth: m.measuredWidth,
        measuredHeight: m.measuredHeight,
      }
}

/** Load an existing swatch into a single-attempt entry draft (edit mode). */
export function swatchToEntry(s: Swatch): EntryDraft {
  const m = s.measurement
  const measure = emptyMeasure(m.unit)
  if (m.method === 'gauge-span') {
    measure.stitchCount = m.stitchCount
    measure.rowCount = m.rowCount
    measure.span = m.span
  } else {
    measure.castOnStitches = m.castOnStitches
    measure.totalRows = m.totalRows
    measure.measuredWidth = m.measuredWidth
    measure.measuredHeight = m.measuredHeight
  }
  return {
    yarns: s.yarns.map((y) => ({ ...y })),
    needleMaterial: s.needleMaterial,
    stitchPattern: s.stitchPattern,
    construction: s.construction,
    measurementMethod: m.method,
    measurementUnit: m.unit,
    project: s.project,
    notes: s.notes,
    attempts: [{ needleSizeMm: s.needleSizeMm, blocked: s.blocked, measure }],
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10

export interface BuildResult {
  swatches: Swatch[]
  error?: string
}

/**
 * Expand an entry into one Swatch per attempt. When `editing` is set there is
 * exactly one attempt, which keeps the existing id/createdAt.
 */
export function entryToSwatches(
  draft: EntryDraft,
  editing: Swatch | null,
  now: string,
): BuildResult {
  const swatches: Swatch[] = []
  for (let i = 0; i < draft.attempts.length; i++) {
    const a = draft.attempts[i]
    const where = draft.attempts.length > 1 ? `Swatch ${i + 1}: ` : ''
    if (!a.needleSizeMm) {
      return { swatches: [], error: `${where}enter a needle size.` }
    }
    const measurement = attemptMeasurement(draft, a)
    const g = derivePer10cm(measurement)
    if (!g.stitchesPer10cm || !g.rowsPer10cm) {
      return { swatches: [], error: `${where}enter the measurements.` }
    }
    swatches.push({
      id: editing ? editing.id : crypto.randomUUID(),
      createdAt: editing ? editing.createdAt : now,
      yarns: draft.yarns.map((y) => ({ ...y })),
      needleSizeMm: a.needleSizeMm,
      needleMaterial: draft.needleMaterial,
      stitchPattern: draft.stitchPattern,
      construction: draft.construction,
      measurement,
      stitchesPer10cm: round1(g.stitchesPer10cm),
      rowsPer10cm: round1(g.rowsPer10cm),
      blocked: a.blocked,
      project: draft.project,
      notes: draft.notes,
    })
  }
  return { swatches }
}
