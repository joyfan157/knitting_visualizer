import type {
  Swatch,
  Yarn,
  Measurement,
  NeedleMaterial,
  StitchPattern,
  Construction,
} from './types'
import { newYarn } from './defaults'
import { derivePer10cm } from './gauge'

// An "entry" is the form's unit of work: one shared project + yarn, with one or
// more gauge-swatch *attempts*. Each attempt carries its own needle, technique,
// and measurement (a project can mix stockinette and rib, different needles,
// etc.). Each attempt is stored as its own independent Swatch; the journal
// groups them back together by project + yarn.

export interface Attempt {
  /** Set when this attempt maps to an existing Swatch (edit); absent = new. */
  id?: string
  createdAt?: string
  needleSizeMm: number
  needleMaterial: NeedleMaterial
  stitchPattern: StitchPattern
  construction: Construction
  blocked: boolean
  measurement: Measurement
}

export interface EntryDraft {
  project?: string
  yarns: Yarn[]
  notes?: string
  attempts: Attempt[]
}

function gaugeSpanDefault(): Measurement {
  return { method: 'gauge-span', unit: 'cm', stitchCount: 0, rowCount: 0, span: 10 }
}

export function newAttempt(): Attempt {
  return {
    needleSizeMm: 0,
    needleMaterial: 'metal',
    stitchPattern: 'stockinette',
    construction: 'flat',
    blocked: true,
    measurement: gaugeSpanDefault(),
  }
}

/** A fresh attempt that inherits the previous one's technique (just clear the
 *  needle and measured numbers) — fast entry for "same setup, next swatch". */
export function nextAttempt(prev: Attempt): Attempt {
  const m = prev.measurement
  const measurement: Measurement =
    m.method === 'gauge-span'
      ? { method: 'gauge-span', unit: m.unit, stitchCount: 0, rowCount: 0, span: m.span }
      : {
          method: 'full-swatch',
          unit: m.unit,
          castOnStitches: 0,
          totalRows: 0,
          measuredWidth: 0,
          measuredHeight: 0,
        }
  return {
    needleSizeMm: 0,
    needleMaterial: prev.needleMaterial,
    stitchPattern: prev.stitchPattern,
    construction: prev.construction,
    blocked: prev.blocked,
    measurement,
  }
}

export function newEntryDraft(): EntryDraft {
  return {
    project: '',
    yarns: [newYarn()],
    notes: '',
    attempts: [newAttempt()],
  }
}

/**
 * Load a group of swatches (one project + yarn) into an entry draft. Shared
 * fields come from the first swatch; each swatch becomes an attempt that keeps
 * its id so it updates in place.
 */
export function swatchesToEntry(group: Swatch[]): EntryDraft {
  const first = group[0]
  return {
    project: first.project,
    yarns: first.yarns.map((y) => ({ ...y })),
    notes: first.notes,
    attempts: group.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      needleSizeMm: s.needleSizeMm,
      needleMaterial: s.needleMaterial,
      stitchPattern: s.stitchPattern,
      construction: s.construction,
      blocked: s.blocked,
      measurement: { ...s.measurement },
    })),
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10

export interface BuildResult {
  swatches: Swatch[]
  error?: string
}

/**
 * Expand an entry into one Swatch per attempt. Existing attempts (with an id)
 * keep their id/createdAt so they update in place; new attempts get fresh ones.
 */
export function entryToSwatches(draft: EntryDraft, now: string): BuildResult {
  const swatches: Swatch[] = []
  for (let i = 0; i < draft.attempts.length; i++) {
    const a = draft.attempts[i]
    const where = draft.attempts.length > 1 ? `Gauge swatch ${i + 1}: ` : ''
    if (!a.needleSizeMm) {
      return { swatches: [], error: `${where}enter a needle size.` }
    }
    const g = derivePer10cm(a.measurement)
    if (!g.stitchesPer10cm || !g.rowsPer10cm) {
      return { swatches: [], error: `${where}enter the measurements.` }
    }
    swatches.push({
      id: a.id ?? crypto.randomUUID(),
      createdAt: a.createdAt ?? now,
      yarns: draft.yarns.map((y) => ({ ...y })),
      needleSizeMm: a.needleSizeMm,
      needleMaterial: a.needleMaterial,
      stitchPattern: a.stitchPattern,
      construction: a.construction,
      measurement: a.measurement,
      stitchesPer10cm: round1(g.stitchesPer10cm),
      rowsPer10cm: round1(g.rowsPer10cm),
      blocked: a.blocked,
      project: draft.project,
      notes: draft.notes,
    })
  }
  return { swatches }
}
