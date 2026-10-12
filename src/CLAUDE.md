# Frontend

Frontend tests are `*.test.ts` files next to the module they cover. They start
with `/// <reference lib="deno.ns" />`, because the shared `tsconfig.json` has
no Deno types, and use `@std/assert`. Test modules with no side effects only.
Importing a store or anything that touches Tauri at module load won't work under
`deno test`, so pull the pure logic into its own file first (as with
`services/emoteSetUpdate.ts`).

## Layers

Components render. Layers in `src/lib/`, top to bottom:

- `events/` — listeners that map backend events (typed events, EventSub
  notifications, Link) into stores. One file per event family, each exporting
  `start()`. `events/index.ts` starts them all.
- `services/` — one file per feature holding its logic, state, and lifecycle
  (caching, dedupe, outcome handling, retries, listeners).
- `api/` — one thin typed wrapper per command; the only layer that calls
  `bindings.ts` commands. No state, no logic beyond toasts.
- `stores/` — signals and state only. Never call the backend or import from a
  higher layer.
- `types/`, `constants/`, `utils/` — shared leaves.

Components may call an `api/` wrapper directly when it's a plain one-shot call;
once caching, state, or outcome logic is involved, it belongs in a service.
Types always come from `types/`, never re-exported through `api/`.

## Services

A service is a plain ES module, never a class. The module is the singleton.

- **Exports** are functions named for what they do _within the feature_:
  `raid.begin`, `users.get`, `shortcuts.register`. Don't repeat the feature in
  the name (`getUsers`, `sendChatMessage`), because the namespace supplies it.
- **Callers import services as a namespace named after the file**:
  `import * as raid from "../lib/services/raid.ts"`, then call
  `raid.begin(...)`. Types may be imported by name alongside. `api/` wrappers
  keep named imports.
- **State** is module-level `let`/`const`, never exported. Expose reads through
  functions or keep them in a store.
- **Nothing runs on import**, in services and `events/` alike. Listeners,
  timers, and subscriptions start in an exported `start(): () => void` that
  returns its cleanup. Use `unlistenAll` from `events/listen.ts` to collect
  Tauri unlisten promises. `lib/primitives/createServices.ts` calls every
  `start()` once at boot; add new ones there, never a side-effect import.
- **Pure logic** that a service needs but that has no state goes in its own file
  (e.g. `services/emoteSetUpdate.ts`), so it can be tested without Tauri.
- **UI** — `docs/design-system.md` is the source of truth for look and
  behaviour. Primitives live in `src/components/ui/` and feature components
  compose them without restyling. Colours, type, radii, sizes, and motion come
  from `@theme` tokens in `src/App.css`; no raw hex, no shadows.
