# Frontend

The layout and its rules are in `docs/ARCHITECTURE.md`.

All user-facing text goes through `t()` from `i18n/`, keyed in
`src/locales/<language>.json`; `en-US.json` is the source and every file has the same keys. Names of things (Deatch, Link, Twitch, Discord, 7TV, BetterTTV,
FrankerFaceZ, AutoMod, Prime, Bits, Hype Train, VIP, Power-up, badges),
`KEY_*` values and command syntax (`!followage`, `/clip`, `30s`) stay the
same in every language.

Keys read `WHERE_WHAT_KIND`. `WHERE` is the surface the text shows on (`FEED`,
`COMPOSER`, `HEADER`, `RAIL`, `MENU`, `SETTINGS_<SECTION>`, `TRIGGER`, `UI` for
shared controls, `ERROR` for generic failures, ...); toasts take the `WHERE` of
their feature. `KIND` ends every key, one of `_LABEL`, `_TITLE`,
`_DESCRIPTION`, `_PLACEHOLDER`, `_HINT`, `_EMPTY`, `_LINE` (feed sentence),
`_REPLY` (posted to Twitch chat), `_TOAST`, `_ERROR`, `_VALUE` (fragment
inserted into other text), `_STATUS`. Completed events are past tense
(`FEED_RAID_CANCELED_LINE`).

A component may call a `platform/` wrapper directly for a plain one-shot call; once
caching, state, or outcome logic is involved, it belongs in the feature's store. Generated Rust
types come from `shared/types/`; a type one feature owns lives in its
`types.ts` and leaves only through its `index.ts`; external payload shapes
(EventSub) live in `platform/`.

Every Tauri call, commands and plugins alike, goes through `invokeCommand`,
which logs each failure and toasts it unless `silent`; callers never report it
again. Toasts are for what the user did: background work (polling, preloading,
startup sync) calls silently. Await the call when the outcome matters, otherwise end it with
`.catch(() => {})`. `void` marks only promises that cannot reject.

## Stores

A store is a plain ES module, never a class; the module is the singleton.

- Exports are named for what they do within the feature: `raid.begin`,
  `users.get`. The namespace supplies the feature, so don't repeat it.
- Callers import a service as a namespace named after the file
  (`import { raid } from ".../features/activity/index.ts"`). Types may be imported by
  name alongside. `platform/` wrappers keep named imports.
- State is module-level and never exported; expose reads through functions or
  keep them in a store.
- Nothing runs on import. Listeners, timers,
  and subscriptions start in an exported `start(): () => void` that returns its
  cleanup, registered once in `app/createServices.ts`. Collect Tauri
  unlisten promises with `unlistenAll`.
- Pure logic with no state goes in its own file so it can be tested without
  Tauri. Tests are `*.test.ts` next to the module they cover, using Vitest
  from `vite-plus/test`; they run in plain Node with no DOM, and a call that
  reaches Tauri fails.

## Settings

Every stored setting is one line in `preferences/schema/`, which gives its
default, its checking, and its type. Adding a setting needs no migration.
Renaming, moving, or removing one needs a new step at the end of
`schema/migrations.ts` with the next version number; steps are never edited,
reordered, or removed.

## UI

Primitives live in `kit/`; feature components compose them without
restyling, and a missing look is a new variant on the primitive. Colours, type,
radii, sizes, and motion come from the `@theme` tokens in `App.css`; depth is
only `material-*` or `elevation-*`. No raw hex, shadows, or arbitrary values.

- Surfaces are solid. No glass: no `backdrop-blur`, no translucent chrome.
  Only media scrims over images (`bg-media-scrim`) may be see-through.
- Press feedback is `pressable` plus one trigger: `active:pressed`,
  `enabled:active:pressed`, or `group-active:pressed`. Full-width strips get
  colour feedback only, never a scale.
- Highlighted feed rows take a colour from `feed/groups.ts` (or the accent) and
  show it as a 3px left bar with a tint; plain rows have neither.
- Changes driven by the keyboard (selection, navigation) never animate.
- Controls that sit together share one height and icon size.

## Commands

```powershell
vp install          # dependencies
vp exec tauri dev   # run the app
```

Before every commit, from the repo root:

```powershell
vp check --fix --deny-warnings && vp run check:tauri && vp test && vp build
```

`vp check` rejects raw colours, arbitrary values, inline styles, and restyled
primitives.

`platform/bindings.ts` is generated from the Rust side by `vp run bindings`; never
edit it by hand.

## Logging

Use `console.warn` / `console.error`; the log service forwards them to the
backend log file.
