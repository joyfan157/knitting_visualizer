import type { Yarn } from './types'

/** A blank yarn strand (fiber category starts as 'unknown'). */
export function newYarn(): Yarn {
  return { fiberCategory: 'unknown' }
}
