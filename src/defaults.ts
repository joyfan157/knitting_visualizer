import type { Swatch } from './types'

/** A blank swatch draft prefilled with Joy's usual habits (see SPEC.md). */
export function newSwatchDraft(): Omit<Swatch, 'id' | 'createdAt'> {
  return {
    yarn: { fiber: '' },
    needleSizeMm: 4.0,
    needleMaterial: 'metal',
    stitchPattern: 'stockinette',
    construction: 'in-the-round',
    stitchesPer10cm: 0,
    rowsPer10cm: 0,
    blocked: true,
    washed: true,
    project: '',
    notes: '',
  }
}
