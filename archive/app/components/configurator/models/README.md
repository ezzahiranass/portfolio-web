# Parametric models

Each model lives in its own folder under `app/components/configurator/models/` and exports a
`ModelDefinition` from `index.tsx`.

Minimal setup
- `index.tsx`: exports `modelX` with `id`, `name`, `defaults`, `render`, `buildGui`, and optional `camera`.
- `params.ts`: default param values (plain object).
- `gui.ts`: lil-gui controls for *only* the active model.
- `renderer.tsx`: JSX for the model; keep it pure and driven by params.

Quick checklist
1. Create `models/ModelX/` with the files above.
2. Add your model to `models/index.ts` in `configuratorModels`.
3. Keep defaults small and stable; the shell resets params on model switch.

Notes
- The shell mounts *only* the active model’s GUI.
- If you need shared utilities, put them in `app/components/configurator/`.
