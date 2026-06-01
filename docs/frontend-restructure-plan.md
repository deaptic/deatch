# Frontend Restructure

## Chosen structure: Solid official (components / lib), adapted for single-window Tauri

No router (Tauri single window), no FSD ceremony. UI in `components/`, all
non-component logic in `lib/`, entry + root shell at `src/` root.

```
src/
  index.tsx  App.tsx  App.css        # entry + root shell
  components/                        # all UI, grouped by feature
    <feature folders>/
    layout/                          # (structural phase) AppLayout, PanelHost, ChatPanes, EmptyState
    ui/                              # generic primitives (was src/ui)
    icons/                           # (was src/icons)
  lib/                               # all non-component logic
    stores/    (was state/)
    api/       (was commands/)
    services/  managers/  events/  types/  utils/
    primitives/                      # (structural phase) create* composables from App.tsx
    constants.ts
  assets/
```

No `@/` alias — relative imports. Decisions: ui+icons under components; local
composables stay co-located, only app-wide ones move to lib/primitives.

## Phase 1 — relocation: DONE

Scripted move of 142 files + 313 import rewrites. Verified: `tsc --noEmit` green,
`vite build` green (202 modules, assets resolve), git detected 142 renames
(history preserved).

## Phase 2 — structural pass: TODO

Decompose long files by responsibility (not by import count). Targets:
App.tsx (547), Menu (616), command-composer/commands.ts (598), Settings (457),
CommandComposer (360), EmotePicker (354), Chat (345).

Convention to apply:
- Leaf / presentational components take **props** — keep them dumb + reusable.
- Feature containers may read global **stores** directly (idiomatic Solid;
  fine-grained reactivity = no re-render cost).
- Cross-cutting deps use **context** (`createContext`/`useContext`), never deep
  prop-drilling.
- App.tsx → `components/layout/*` (JSX) + `lib/primitives/create*` (the 9 effect jobs).
```
