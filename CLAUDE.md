# Engineering rules

This file defines how the code _should_ be. When code and this file disagree,
fix the code.

## Principles

Two rules win every tie:

- **DRY**: every piece of knowledge has one home. Extract logic, constants, and
  shapes the moment they would exist in two places.
- **Clean code**: small functions that do one thing, names that say what they
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
  of IO and global state; network, storage, UI, and timers live at the
  boundary. Pure logic goes in its own file so it can be tested alone.

When unsure, optimize for the next reader.

## Structure

Group by feature, not by technical type; a change to one feature touches one
place. One concern per file; the filename is the concern. When a file
accumulates unrelated groups, split it along those seams into a folder with a
barrel so import sites stay stable. Private helpers live with their only caller.
Many entries serving one concern is fine; split by concern, not by count.

The folder layout and its import rules live in `docs/ARCHITECTURE.md`.

## Boundaries

Map external shapes to your own types at the edge, once. Past the boundary the
app sees only its own types, never a third-party library's. When mapping would
merely re-type a large external schema you don't control, pass it through and
own the type definition on one side only. One home per shape.

Generated files are never edited by hand: change their source, regenerate,
commit both.

## Naming and comments

Name a thing for what it is or does; let success and failure ride the return
type. Keep names free of their surrounding context, the module already supplies
it. One word per concept, everywhere. Use the plain word a newcomer would guess
first: `Transition`, not `Presence`; `tabs`, not `warmedChannels`. A name that
needs explaining gets renamed when its file is next touched.

No comments, doc comments included. Code that needs one to be understood is
not done: rename, extract a function, name the constant, or move the knowledge
into a type until it reads on its own. Only toolchain directives stay
(type references, hot-reload pragmas, lint and type-check suppressions).

## Logging

One logging path per runtime, never ad hoc prints. Log failures where they are
handled, with enough context to act on them.

## Before committing

Run the project's full check set (format, lint, types, tests, build) and fix
what it finds. CI runs the same.
