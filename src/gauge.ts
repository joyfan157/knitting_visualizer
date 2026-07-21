import type { Measurement } from './types'

// Normalizes any measurement method to a canonical gauge over a 10cm span,
// so swatches measured in cm, in inches, or as a made-to-measure piece are all
// comparable. 1 inch = 2.54 cm exactly (so 4 in = 10.16 cm, not 10 cm).

const CM_PER_INCH = 2.54

export function toCm(value: number, unit: 'cm' | 'in'): number {
  return unit === 'in' ? value * CM_PER_INCH : value
}

export interface Per10cm {
  stitchesPer10cm: number
  rowsPer10cm: number
}

export function derivePer10cm(m: Measurement): Per10cm {
  if (m.method === 'gauge-span') {
    const spanCm = toCm(m.span, m.unit)
    if (spanCm <= 0) return { stitchesPer10cm: 0, rowsPer10cm: 0 }
    return {
      stitchesPer10cm: (m.stitchCount / spanCm) * 10,
      rowsPer10cm: (m.rowCount / spanCm) * 10,
    }
  }
  const widthCm = toCm(m.measuredWidth, m.unit)
  const heightCm = toCm(m.measuredHeight, m.unit)
  return {
    stitchesPer10cm: widthCm > 0 ? (m.castOnStitches / widthCm) * 10 : 0,
    rowsPer10cm: heightCm > 0 ? (m.totalRows / heightCm) * 10 : 0,
  }
}

/** Short human-readable summary of the raw measurement, for tooltips. */
export function describeMeasurement(m: Measurement): string {
  if (m.method === 'gauge-span') {
    return `${m.stitchCount} sts & ${m.rowCount} rows over ${m.span} ${m.unit}`
  }
  return `cast on ${m.castOnStitches} sts, knit ${m.totalRows} rows → ${m.measuredWidth} × ${m.measuredHeight} ${m.unit}`
}
