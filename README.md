# knitting_visualizer

A personal knitting tool: a **gauge/tension database** that predicts your gauge
for new yarn/needle/pattern combinations, growing into a **3D visualizer** that
turns knitting patterns (written or described in natural language) into 3D
models. See [SPEC.md](./SPEC.md) for the full vision, scope, and roadmap.

> Scope note: this is a **knitting** tool. Crochet (and amigurumi, which is
> crochet) is structurally different and out of scope for now — see SPEC.md.

## Current milestone: gauge journal + prediction

A local-first web app. Log swatches (it doubles as a swatch journal) and get a
predicted gauge with an honest uncertainty range that sharpens as you log more.
Your data lives in your browser (IndexedDB); export/import JSON to back it up.

## Run it

```bash
npm install
npm run dev        # start the dev server, open the printed URL
```

Other scripts:

```bash
npm run build      # typecheck + production build
npm run typecheck  # types only
npm run preview    # serve the production build
```

## Stack

TypeScript + React + Vite. Three.js will come in with the 3D milestone.
