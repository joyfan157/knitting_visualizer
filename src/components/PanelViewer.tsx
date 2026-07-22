import type { PanelGraph, PanelLayout } from '../knit/panel'

// Renders the flat panel's stitch graph as 2D SVG: a light line for every edge,
// and a dot for every stitch. Coordinates are in centimeters; y is flipped so
// the cast-on row sits at the bottom.

// Above this many stitches we drop the per-stitch dots (the edge grid already
// shows the structure) to keep the DOM light.
const MAX_DOTS = 2000

export function PanelViewer({
  graph,
  layout,
}: {
  graph: PanelGraph
  layout: PanelLayout
}) {
  const { x, y } = layout
  if (x.length === 0) return null

  let minX = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (let i = 0; i < x.length; i++) {
    if (x[i] < minX) minX = x[i]
    if (x[i] > maxX) maxX = x[i]
    if (y[i] > maxY) maxY = y[i]
  }

  const pad = 0.6 // cm
  const fy = (yi: number) => maxY - yi // flip so cast-on is at the bottom

  const path = graph.edges
    .map(
      ([a, b]) =>
        `M${x[a].toFixed(2)} ${fy(y[a]).toFixed(2)}L${x[b].toFixed(2)} ${fy(
          y[b],
        ).toFixed(2)}`,
    )
    .join('')

  const viewBox = `${(minX - pad).toFixed(2)} ${(-pad).toFixed(2)} ${(
    maxX -
    minX +
    2 * pad
  ).toFixed(2)} ${(maxY + 2 * pad).toFixed(2)}`

  const showDots = x.length <= MAX_DOTS
  const dotR = Math.min(0.18, (10 / layout.maxStitches) * 0.35)

  return (
    <svg className="panel-svg" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
      <path className="panel-edges" d={path} fill="none" />
      {showDots &&
        Array.from({ length: x.length }, (_, i) => (
          <circle
            key={i}
            className="panel-stitch"
            cx={x[i].toFixed(2)}
            cy={fy(y[i]).toFixed(2)}
            r={dotR}
          />
        ))}
    </svg>
  )
}
