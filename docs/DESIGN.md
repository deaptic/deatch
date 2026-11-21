# Design system

The rulebook for look and behaviour. It says what the tokens mean and how
things are built, not how each screen is laid out. Values live once, in the
theme tokens; code follows this document, and when they disagree, fix the code.

## Principles

- **Content first.** The interface is quiet so content can be loud. If a choice
  makes the main content harder to read, it is wrong.
- **Flat ground, floating materials.** The base layers step between tones, with
  a 1px line only where a step alone is ambiguous, and cast no shadows. Only
  what floats over content is a material, so it is always clear what sits above
  and what is underneath.
- **Neutral structure, chromatic signals.** Neutrals build the layout; anything
  with colour means something: selected, status, a category.
- **One way per job.** One hover, one selection, one accent, one component per
  pattern.
- **Space groups.** A line separates only when a gap cannot.
- **Motion answers the user.** Nothing moves on its own except a live status
  indicator. Everything else responds to the press and finishes fast.
- **Words are design.** Short, warm, plain, sentence case.

## Tokens

Use tokens only, by name. Every colour has a dark and a light value, switched
by `data-theme` on the root (defaulting to the system).

### Colour

Tones step from darkest to lightest: `canvas` (the window and main content),
`surface` (side panels, cards, inputs), `raised` (hover, chips, active chrome),
`overlay` (the solid top tone, such as a selected segment or a pressed
control). Hover moves one tone up, pressed two. `scrim` dims everything behind
a dialog; `media-scrim` is the same dark wash in both themes, behind anything
laid over images or video. `picture` is the plate behind avatars, a step
outside every tone, so a transparent image keeps its shape on any row,
hovered or selected.

Text is `ink` (body, headings), `ink-soft` (secondary text, idle icons) or
`ink-faint` (placeholders, disabled, information also available another way).
Lines are `line-soft` inside a surface and `line` on inputs and floating
layers.

The accent is one colour meaning "selected, active, or about you": `accent`
(fills), `accent-hover`, `accent-ink` (text or icon), `accent-soft` (tinted
rows, focus halos), `on-accent` (text on fills). If users can replace it, keep
only its hue and chroma so the set stays readable.

Status colours are `live`, `positive`, `caution`, `negative`, `info`. When two
signals share a hue, shape tells them apart. Category colours mark with a thin
bar or a light tint, never a full fill. Colours that come from outside (user-
or data-chosen) are lightness-clamped per theme so they always read.

### Materials and elevation

A floating layer wears a material: a translucent `material` fill with a
backdrop blur, a 1px `line` and its elevation. Bigger layers read thicker:

- `material-thin`: tooltips, hover toolbars, transient readouts.
- `material-regular`: menus, popovers, dropdown lists, toasts.
- `material-thick`: command palettes, large floating cards.

Never stack one material on another.

A solid element lifted off what is under it takes an elevation alone:
`elevation-1` (a segment thumb, a toggle knob), `elevation-2` (a pill floating
over content), `elevation-3` (a dialog, which also dims what is behind it). In
dark themes, elevation adds a faint light edge along the top.

Materials turn solid (`overlay`, no blur) when the system asks for reduced
transparency or more contrast.

### Type

One readable sans for everything read; a mono only for IDs, code and payloads.
The scale is `hero` (greetings, empty landing pages), `heading` (page titles),
`title` (names, card and dialog titles), `body` (UI text), `small`
(descriptions, tooltips, chips), `micro` (badges, counts).

Each step carries its own leading and tracking: large type is tight, with
negative tracking; small type opens up. Never add `tracking-*` on top.
Emphasise with weight, not size. Content that follows a user's text-size
setting is sized in `em`, so everything in it scales together.

### Space and shape

Space is the 4px scale. Radius grows with the element: `xs` (nested inside
`sm`, thin things like meters), `sm` (controls), `md` (popovers, cards,
inputs), `lg` (dialogs, big cards), `round` (avatars, dots, badges, toggles,
pills floating over content). Control heights are `control-sm/md/lg`.
Icon-only controls are square, with a hit target of at least 32px.

### Motion

Durations are `snap` (colour changes, press feedback), `quick` (small moves,
floating layers arriving) and `settle` (panes, toasts). Curves are `ease-out`
for anything arriving or answering a press, and `ease-drawer` for panes sliding
across the window. Never use `ease-in`.

- Pressable controls scale to 97% while held.
- A floating layer arrives with `enter-pop`, growing from 97% out of the corner
  nearest whatever opened it (`origin-*`). Dialogs grow from their centre.
- Nothing animates on the way out, and nothing animates from scale 0.
- Keyboard-driven changes (moving a selection, switching views) never animate.
- Under reduced motion, transitions and idle animation are off.

### Pictures and icons

People are avatars: round by default, square (`xs`) in dense lists and beside
multi-line blocks. Content images keep their native aspect ratio and are never
cropped to a different one; a new kind of picture is a new shape. Images sit on
`raised` while loading, and their radius follows where they sit (`xs` inline,
`md` on their own, none when they bleed to a card's edge). Anything laid over
an image uses `media-scrim`.

Icons come from one set and inherit text colour. Sizes are 16 on controls and
menu items, 20 in headers and navigation, and 24 in empty states. A glyph
inside a chip or badge sizes with its text, and window controls follow the
platform.

## Building

- Tokens and Tailwind only: no raw hex, shadows, blur, gradients or arbitrary
  values. Depth is only ever `material-*` or `elevation-*`; Tailwind's own
  `shadow-*` inlines its value and would ignore a theme switch.
- A custom `@utility` is for a recipe several primitives share, not a one-off.
- Values that must follow runtime state (a user's text size) are CSS variables,
  set once where that state lives.
- One component per file. Primitives own their look, and feature code composes
  them without restyling. A missing look is a new variant on the primitive.
- Layout is intrinsic: no breakpoints; flex wraps and grids auto-fill, and
  everything is usable at the minimum window size.

### Patterns

**Tooltips** are the app's own, never the native `title`. They appear after a
short delay, above the element or below it when there is no room, and never
cover window chrome. A tooltip only says what is not already on screen: the
name of an icon, a full date, hidden detail. Icon-only controls also carry an
`aria-label`.

**Floating layers** open 4px below what opened them (8px when beside or above
it), stay inside an 8px viewport margin, and close on Escape or an outside
click. The opener toggles them. Only one menu, one popover and one dialog are
open at a time; Escape closes the topmost and focus returns to where it came
from. Choosing a menu item closes the menu, unless the item opens a submenu or
steps back out of one.

**Picking from a long list** uses a combobox. The field always shows the
current value (or a placeholder, with × to clear). Focus opens the list below
and selects the text, so typing filters it. One row is always highlighted;
arrows and hover move the highlight and Enter picks the row. Focus never leaves
the field, and Escape, Tab or clicking away close the list unchanged.

**A value on a range** uses a stepped slider when it snaps to a few labelled
choices, or a continuous slider that applies live while dragging. A continuous
slider shows its value next to it.

**Selection** in a list or nav is a 3px `accent` bar on the row's leading edge
over a `raised` row; the row itself stays neutral. When that edge already
carries meaning, selection becomes an `accent` outline.

**Fading means unusable.** Anything that can't be used or is finished fades to
40%. Something switched off but still editable is not faded; its state shows in
its own control. Pressed filled buttons dip to 90%, and interactive images
fade to 80% on hover.

**Feedback happens where the action happened.** Use a toast only when the
result is out of view. Errors sit next to what failed.

## Keyboard and focus

Everything reachable by mouse has a key, and bindings show in tooltips.
Ctrl acts on documents or tabs, as a browser's tab keys do, and Alt toggles
app-wide modes. Never bind Ctrl+Alt: on many layouts it is AltGr and types a
character instead.

`:focus-visible` draws a 2px `accent` outline, and text fields show focus as an
`accent` border with a 3px `accent-soft` halo. Mouse clicks never show the
outline. When a floating layer closes, focus returns to the primary input.

## Voice

Sentence case. Buttons say what happens ("Save draft", never "OK"), and the
result keeps the word ("Saved"). Errors are direct and say what to do, without
apology. Empty states invite the user in, in one line. Keep a fixed vocabulary:
one word per concept, everywhere.

## Accessibility

- `ink` and `ink-soft` keep at least 4.5:1 contrast; `ink-faint` is only for
  information also available another way.
- Colour is never the only signal.
- Every image has `alt`.
- Reduced motion turns transitions and idle animation off; reduced transparency
  and more contrast turn materials solid.
- Everything works from the keyboard.
