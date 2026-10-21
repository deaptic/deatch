# Frontend

Components render. Everything else lives in `src/lib/`, in layers that only
import downward:

- `events/` — listeners that map backend events into stores. One file per event
  family, each exporting `start()`.
- `services/` — one module per feature holding its logic, state, and lifecycle
  (caching, dedupe, outcome handling, retries, listeners).
- `api/` — one thin typed wrapper per command; the only layer that calls
  `bindings.ts`. No state, no logic beyond toasts.
- `stores/` — signals and state only. Never call the backend.
- `types/`, `constants/`, `utils/`, `format/`, `i18n/` — shared leaves.

All user-facing text goes through `t()` from `i18n/`, keyed in
`src/locales/en.json`. Names of things (Deatch, Link, Twitch, badges) stay as
plain text inside messages.

A component may call an `api/` wrapper directly for a plain one-shot call; once
caching, state, or outcome logic is involved, it belongs in a service. Types
come from `types/`, never re-exported through `api/`.

## Services

A service is a plain ES module, never a class; the module is the singleton.

- Exports are named for what they do within the feature: `raid.begin`,
  `users.get`. The namespace supplies the feature, so don't repeat it.
- Callers import a service as a namespace named after the file
  (`import * as raid from ".../services/raid.ts"`). Types may be imported by
  name alongside. `api/` wrappers keep named imports.
- State is module-level and never exported; expose reads through functions or
  keep them in a store.
- Nothing runs on import, in services and `events/` alike. Listeners, timers,
  and subscriptions start in an exported `start(): () => void` that returns its
  cleanup, registered once in `primitives/createServices.ts`. Collect Tauri
  unlisten promises with `unlistenAll`.
- Pure logic with no state goes in its own file so it can be tested without
  Tauri. Tests sit next to the module they cover (`docs/TESTING.md`).

## UI

`docs/DESIGN.md` is the source of truth for look and behaviour. Primitives live
in `components/ui/`; feature components compose them without restyling, and a
missing look is a new variant on the primitive. Colours, type, radii, sizes, and
motion come from the `@theme` tokens in `App.css`; no raw hex, shadows, or
arbitrary values.
