# Deatch design system

Deatch keeps every chat you care about open at once, for people who spend hours
in it. It should feel like a warm, well-lit room: switching is effortless and
nothing gets in the way of reading.

This is the rulebook. It says what the tokens mean and how things are built, not
how each screen is laid out. Values live once, in the `@theme` block of
`src/App.css`. Code follows this document; when they disagree, fix the code.

## Principles

1. **Reading comes first.** If a choice makes chat harder to read, it is wrong.
2. **Warm, calm, quick.** Plum-tinted surfaces, round corners, soft type. Chat
   is loud, the interface is quiet. Every common action is one click or key away
   and responds at once.
3. **Flat.** No shadows, gradients, blur, or glass. Depth comes from stepping
   between tones, plus a 1px line where a tone step alone is ambiguous.
4. **Colour is meaning.** Neutrals build structure. Anything with chroma is a
   signal: live, mention, event, status, selected.
5. **One way per job.** One hover, one selection, one accent, one component per
   job. Space groups; a line separates only when a gap cannot.
6. **Motion answers the user.** Only the live indicator moves on its own.
   Everything else moves because the user did something, and finishes fast.
7. **Words are design.** Short, warm, plain, sentence case.

## Tokens

Use tokens only, by name. Every colour token has a dark and a light value,
switched by `data-theme` on the root (defaulting to the system).

**Tones**, darkest to lightest step: `canvas` (window, feed), `surface` (rail,
composer, cards, inputs), `raised` (hover, chips, active chrome), `overlay`
(popovers, menus, tooltips; always with a 1px `line`). `scrim` sits behind
dialogs; `media-scrim` is the same dark wash in both themes, behind anything
laid over images or video. Hover moves one tone up, pressed two.

**Text:** `ink` (body, headings), `ink-soft` (secondary, timestamps, idle
icons), `ink-faint` (placeholders, disabled, metadata available another way).

**Lines:** `line-soft` (dividers inside a surface), `line` (inputs, overlays).

**Accent:** one colour meaning "selected, active, or about you". `accent`
(fills), `accent-hover`, `accent-ink` (accent as text or icon), `accent-soft`
(tinted rows), `on-accent` (text on fills). Users may replace it; only its hue
and chroma are kept, so the set stays readable.

**Status:** `live`, `positive`, `caution`, `negative`, `info`. Live and negative
share a hue; shape tells them apart (a dot or pill is live).

**Events:** `event-*`, one per Twitch event, shown as a 3px bar and a 10% tint,
never a fill.

**Chatter colours:** a chatter's Twitch colour, lightness clamped per theme so
it reads; a chatter with no colour is `ink-soft` grey everywhere.

**Type:** Atkinson Hyperlegible Next for everything read; Cascadia Mono for IDs
and payloads. Scale: `hero` (greetings), `heading` (page titles), `title`
(names, card and dialog titles), `body` (UI text), `small` (descriptions,
tooltips, chips), `micro` (badges, counts). The feed sizes in `em` from the
user's chat text size, so everything in a row scales with it.

**Space:** the 4px scale. **Radius:** `xs` (only nested in `sm`), `sm`
(controls), `md` (popovers, cards, composer), `lg` (dialogs, big cards), `round`
(avatars, pills, badges); radius grows with the thing. **Size:**
`control-sm/md/lg` heights; icon-only controls are square, hit target at least
32px. **Motion:** `snap` (colour changes), `quick` (small moves, popovers),
`settle` (panes, pages); `ease-out`. **Pictures:** people and channels are
`Avatar`, always round (square only beside a multi-line block). Pictures of
content are `Artwork` and keep their native shape, never cropped to another one:
`boxart` 3:4, `video` 16:9; a new kind of picture is a new shape there. Artwork
sits on `raised` while loading; its radius follows where it sits (`xs` inline in
a row, `md` on its own, none when it bleeds to a card's edge); anything laid
over it uses `media-scrim`. **Icons:** Lucide, 16 on every control and menu
item, 20 in headers and rail tiles, 24 in empty states; a glyph inside a chip or
badge sizes with its text; window controls follow Windows at 12. Icons inherit
text colour.

## Building

- **Tokens and Tailwind only.** No raw hex, shadows, gradients, arbitrary
  values, or new `@utility` rules. Values that must follow runtime state (chat
  text size) are CSS variables set once where that state lives.
- **One component per file.** Primitives live in `src/components/ui/`; feature
  code composes them and never restyles. A missing look is a new variant on the
  primitive.
- **Overlays** are `overlay` with a 1px `line`, open 4px from what opened them,
  stay inside an 8px viewport margin, and close on Escape or outside click. The
  opener toggles. One menu, one popover, and one dialog at a time; Escape closes
  the topmost and focus returns where it came from.
- **Choosing from a long list is a `Combobox`.** The field always shows the
  current value (or its placeholder when none, with × to clear); focus opens the
  list attached below and selects the text so typing filters it; one row is
  always highlighted, arrows and hover move it, Enter picks it; focus never
  leaves the field; Escape, Tab, or clicking away close it unchanged.
- **Fading means unusable.** 40% for anything that can't be used or is finished
  (disabled controls, resolved AutoMod holds, a dragged rail row). Something
  switched off but still editable is not faded; its state shows in its own
  control. Pressed filled buttons dip to 90%; artwork fades to 80% on hover.
- **Feedback happens where the action happened.** A toast only when the result
  is out of view. Errors sit next to what failed.
- **Layout is intrinsic.** No breakpoints or media queries; flex wraps and grids
  auto-fill, usable down to 800×500.

## The feed

- **Every entry is one `FeedItem`.** It owns all row layout. Each kind (message,
  event) only supplies its parts: tone, tile, notes, overlay, content.
- **Tone**, one per row, in precedence: held by AutoMod (`caution`), mentions
  you (`accent`), cheer (`event-bits`), reward (`event-channel-points`), first
  message (`line` on `surface`), event (its colour), plain. Selected adds an
  `accent` outline. Hover lifts the row one tone.
- **Notes sit above the message**, never beside the name: AutoMod reason,
  "Cheered N bits", reward, "First message", then the reply line with a
  connector down to the message. Notes start where the message text starts.
- **Two layouts.** Compact is one line per message with an optional timestamp
  column. Comfortable groups a chatter's messages (same chatter, under five
  minutes, same day, nothing between) under one header with a tile in a gutter;
  the tile sits centred on the first two lines of every row. Replies, holds,
  cheers, rewards, and first messages always start a group.
- **Cheermotes** render inline at emote size with the amount after them in the
  tier's colour, clamped like a chatter colour; under reduced motion they show
  their still image.
- **The chatter tile** is a blobatar drawn locally from the user ID, in the hue
  of their name colour (grey without one), tinted behind with the same colour.
  It moves only while its row is hovered or selected.
- **Deleted messages stay quiet:** muted text and "(deleted)", nothing added
  that would paint the feed or move it during a mass cleanup.
- **Time:** clock time today, "Yesterday at" then the date for older; hovering
  any time shows the full date. Day dividers mark where the date changes.

## Keyboard and focus

Everything reachable by mouse has a key; bindings live in
`src/default-keymap.json` and show in tooltips and Settings → Keyboard.
`:focus-visible` draws a 2px `accent` outline; text fields show focus through
their border; mouse clicks never show the outline. Focus returns to the composer
when an overlay closes.

## Voice

Sentence case. Buttons say what happens ("Pin channel", never "OK"), and the
result keeps the word ("Pinned"). Errors are direct and say what to do, without
apology. Empty states invite in one line. Fixed vocabulary: channel, chatter,
pin, live, Watch, Inbox, Explore, AutoMod, raid, bits, shoutout.

## Accessibility

`ink` and `ink-soft` keep at least 4.5:1 contrast; `ink-faint` only for
information also available another way. Colour is never the only signal. Every
image has `alt`. Reduced motion turns transitions and idle animation off.
Everything works from the keyboard.
