# Deatch

Native Twitch chat client. Tauri 2 (Rust backend) + Solid.js / Vite / Tailwind 4
frontend. Windows only. Big picture in `docs/ARCHITECTURE.md`.

This file defines how the code _should_ be. When code and this file disagree,
fix the code.

## Commands

```powershell
pnpm install              # frontend deps
pnpm tauri dev       # run app in dev
pnpm bindings        # regenerate src/lib/bindings.ts
pnpm test            # frontend unit tests
deno fmt && deno lint && pnpm lint:ui
cd src-tauri && cargo fmt && cargo clippy --all-targets && cargo test --lib
```

Run the full check set before every commit; CI runs the same with clippy at
`-D warnings` (`docs/TESTING.md`). Release with `pnpm release`
(`docs/RELEASING.md`).

## Principles

Two rules win every tie:

- **DRY** — every piece of knowledge has one home. Extract logic, constants, and
  shapes the moment they would exist in two places.
- **Clean code** — small functions that do one thing, names that say what they
  mean, no dead code.

Then:

- **Make illegal states unrepresentable.** Enums and discriminated unions over
  loose booleans and strings, so the compiler rejects states that should never
  exist.
- **Errors are values.** Handle or propagate, never swallow. Surface failures at
  the boundary; ignoring one is a deliberate, visible choice.
- **YAGNI.** Build for the need in front of you. Abstraction earns its place on
  the third occurrence.
- **KISS.** Of the options that work, take the simplest. A one-liner that needs
  decoding is not simple.
- **Explicit over implicit.** Dependencies are arguments, lifecycle is a visible
  `start`/cleanup, nothing runs on import, no hidden globals.
- **One way per job.** Find the existing pattern and follow it; a second way to
  do the same thing is a defect, not a choice.
- **Composition over inheritance.** A base class has to earn its existence with
  real shared behaviour.
- **Pure core, effects at the edge.** Decision and transformation logic is free
  of IO and global state; network, storage, DOM, and presence live at the
  boundary. Pure logic goes in its own file so it can be tested alone.

When unsure, optimize for the next reader.

## Structure

Group by feature, not by technical type; a change to one feature touches one
place. One concern per file; the filename is the concern. When a file
accumulates unrelated groups, split it along those seams into a folder with a
barrel so import sites stay stable. Private helpers live with their only caller.
Many entries serving one concern is fine; split by concern, not by count.

Dependencies flow one way: entry points call services, services call clients,
clients talk to the outside world. Lower layers never reach back up. Handlers
and components stay thin; logic and long-lived state live in services. State
lives independently of what is mounted on screen.

Frontend layering: `src/CLAUDE.md`. Backend layering: `src-tauri/CLAUDE.md`.

## Boundaries

Map external shapes to your own types at the edge, once. Past the boundary the
app sees only its own types, never a third-party library's. When mapping would
merely re-type a large external schema you don't control, pass it through and
own the type definition on one side only. One home per shape.

`src/lib/bindings.ts` is generated from the Rust commands, types, and events.
Never edit it by hand; change the Rust side, regenerate, commit both.

## Naming and comments

Name a thing for what it is or does; let success and failure ride the return
type. Keep names free of their surrounding context, the module already supplies
it. One word per concept, everywhere.

Make the code explain itself. Comment only the non-obvious _why_, and prefer
reshaping the code until even that is unnecessary.

## Logging

Backend logs go through the `log` crate, never `println!`. Frontend code uses
`console.warn` / `console.error`; the log service forwards them to the backend
log file.
