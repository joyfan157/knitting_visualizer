import type { Swatch, Measurement } from './types'

/** A blank swatch draft prefilled with Joy's usual habits (see SPEC.md). */
export function newSwatchDraft(): Omit<Swatch, 'id' | 'createdAt'> {
  const measurement: Measurement = {
    method: 'gauge-span',
    stitchCount: 0,
    rowCount: 0,
    span: 10,
    unit: 'cm',
  }
  return {
    yarn: { fiber: '' },
    needleSizeMm: 0, // unset — no default needle (Joy works across many sizes)
    needleMaterial: 'metal',
    stitchPattern: 'stockinette',
    construction: 'flat',
    measurement,
    stitchesPer10cm: 0,
    rowsPer10cm: 0,
    blocked: true,
    project: '',
    notes: '',
  }
}
