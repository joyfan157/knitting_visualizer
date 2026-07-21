# Knitting Visualizer — Project Spec

_Last updated: 2026-07-21_

## Vision

A personal knitting tool with two connected halves:

1. **A gauge/tension database** that learns the knitter's personal gauge across
   yarns, needles, and stitch patterns, and **predicts** likely gauge for
   new combinations — with an honest uncertainty range.
2. **A 3D visualizer/modeler** that turns a knitting pattern (written text _or_
   a natural-language description) into a 3D model of the finished object, and
   can generate the corresponding written pattern from a description.

**Stretch goal:** make the modeler an _editor_ — an "Onshape for knitting" where
you sculpt/parametrically edit the 3D object and the written pattern stays in
sync, so pattern design becomes interactive with the final product instead of a
numbers-first, test-knit-to-find-out process.

## The unifying idea: the stitch graph

Every knitted object is a mesh of interlocking **live loops**. Model it as a
graph where each stitch is a node linked to its neighbors (the stitch below it
and the ones beside it). Almost everything is a _view_ of this one structure:

- **Gauge** = the physical size of each stitch (width vs height; knit stitches
  are wider than tall, and the ratio shifts with needle/yarn/fiber).
- **3D model** = the stitch graph + gauge-derived rest sizes, relaxed into shape
  by a mass-spring physics simulation. Increases/decreases in the graph _are_
  the shaping.
- **Written pattern** = a linear traversal of the graph ("Round 3: k5, kfb, …").
- **Editor** = because the graph is the single source of truth, editing the
  shape, the graph, and the pattern are the same operation kept in sync by
  construction.

Prior art confirms the graph→3D pipeline is real (CMU machine-knitting research,
stitch-mesh papers).

## Scope decision: knitting, NOT crochet

This is a **knitting** tool. Knitting and crochet are structurally different and
cannot be modeled as variants of each other:

- **Knitting** — a mesh of interlocking live loops worked a whole row/round at a
  time. Fabric behaves like stretchy jersey; drapes and curves smoothly; needs
  shaping + stuffing to hold a 3D form. Topology ≈ a regular grid of loops.
- **Crochet** — discrete posts (sc/hdc/dc…), each with its own height, worked and
  closed one at a time, anchored into the row below. Fabric is dense, firm,
  sculptural, stacks in coils, and holds 3D shape on its own. (This is why
  amigurumi is crochet — the structure is load-bearing.)

The stuffed-toy use case ("emotional support chicken" family) is therefore
**knitted toys worked in the round** — never called "amigurumi." Crochet may
become a _future module_ with its own stitch model, but is out of scope for now.
Gauge applies to both crafts, so starting with the gauge DB doesn't foreclose it.

## Roadmap

1. **Gauge DB + prediction** ← _current milestone_
   - Log swatches (also serves as a swatch journal).
   - Predict gauge for a yarn/needle/pattern combo, with a range.
2. **3D proof-of-concept** — stitch graph → physics relaxation → render a simple
   knitted shape. First target: **knitted in-the-round toys**.
3. **Pattern parsing / generation** — written pattern ↔ stitch graph; NL
   description → generated written pattern (likely LLM + geometry engine).
4. **Stretch: interactive editor** — bidirectional 3D ↔ pattern editing.

## Milestone 1: Gauge database

### Swatch data model

- **Yarn:** a swatch holds an **array of strands** (`yarns[]`); length 1 is a
  single yarn, more means held together. Each strand has: brand, name, **fiber
  category** (animal / plant / synthetic / blend / unknown — required, defaults
  to `unknown` for unlabeled/thrifted yarn), optional **specific fiber** text
  (e.g. "100% merino"), weight category (lace→super-bulky), grist as
  `metersPerGram` (standard yarn-label figure) and/or `wpi` (wraps per inch) —
  both optional, plies.
- **Tools:** needle size in **mm** (canonical); needle material (defaults to
  **metal** — Joy uses a full interchangeable metal kit).
- **Technique:** stitch pattern (stockinette, garter, ribbing, seed, cable,
  other); construction flat vs in the round (defaults to **flat**).
- **Measured result:** flexible entry, normalized to a canonical **stitches &
  rows per 10cm**. Two methods: (a) _gauge-span_ — count sts/rows over a measured
  window; (b) _full-swatch / made-to-measure_ — cast on N sts, knit M rows, then
  measure the finished piece's width & height. Window/piece dimensions can be
  given in **cm or inches** (1 in = 2.54 cm exactly, so 4 in = 10.16 cm ≠ 10 cm;
  we convert precisely). Plus blocked (default true). (No separate "washed"
  field — Joy wet-blocks, so washing is implied by blocking.)
- **Meta:** created date, project, notes.

**Entry vs. storage vs. journal.** Each gauge swatch is stored as an independent
`Swatch`. But the _form_ works in "entries": one shared **project + yarn** with a
list of gauge-swatch **attempts**, each saved as its own swatch. Only project,
yarn, and notes are shared across attempts — **needle size, needle material,
stitch pattern, construction, and measurement are per attempt**, so one project
can mix (e.g.) stockinette on one needle and 1×1 rib on a smaller needle. The
_journal_ re-groups swatches by **project + yarn only**, showing all of a
project's swatches together under one heading (needle/pattern/construction shown
per row) with a single **Edit** button that loads the whole group back into the
form (adding an attempt creates a swatch; removing one deletes it). Project leads
both the form and the journal — it's the primary way Joy parses her swatches.

Smart defaults reflect Joy's habits (metal needles, flat, blocked) so entry
is fast, but every field stays editable for old swatches or experiments.
**Biggest predictive levers (per Joy): fiber composition and needle size.**

### Prediction approach

A **model** here = a function from inputs (fiber, needle size, pattern, …) to a
predicted gauge (sts/10cm, rows/10cm) with a ± range. Three blended ingredients:

1. **Physics baseline** — stitch width scales with needle diameter; gives a sane
   guess with zero personal data. Knit stitches are wider than tall, so rows/10cm
   > sts/10cm.
2. **Learned from Joy's swatches** — similar swatches pull the prediction toward
   her real tension. Similarity weighs needle size, **strand count** (held-
   together strands change gauge a lot), fiber category, stitch pattern, and
   construction. 'unknown' fiber is treated as "no constraint".
3. **Uncertainty** — reported as a range that is wide with little data and
   narrows as the journal grows. No false precision.

v1 is "informed curve-fitting" (weighted blend of matching swatches + physics
prior), not heavy ML. Can graduate to Gaussian processes / hierarchical models
later if data justifies it.

## Tech stack

- **Web app, local-first.** TypeScript + React + Vite. Data in the browser
  (IndexedDB) with JSON export/import for backup — no server, works offline,
  data stays on Joy's machine.
- **3D (later):** Three.js.
- **Prediction:** TypeScript for now; a Python service is the escape hatch if the
  ML gets heavy.

## Working agreement

Claude leads the implementation and explains web/3D/ML-specific choices; Joy
steers product direction and tests against real knitting. Commits authored as
`Joy Fan <joy.fan.157@gmail.com>`, no Co-Authored-By trailer.
