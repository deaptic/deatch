# Design system

The app keeps every chat you care about open at once, for people who spend hours
in it. It should feel like a warm, well-lit room: switching is effortless and
nothing gets in the way of reading.

This is the rulebook. It says what the tokens mean and how things are built, not
how each screen is laid out. Values live once, in the `@theme` block of
`src/App.css`. Code follows this document; when they disagree, fix the code.

## Principles

Reading comes first; if a choice makes chat harder to read, it is wrong. The
interface is quiet so chat can be loud: plum-tinted surfaces, round corners,
soft type, every common action one click or key away. Everything is flat, with
no shadows, gradients, blur, or glass; depth comes from stepping between tones,
plus a 1px line where a step alone is ambiguous. Neutrals build structure and
anything with chroma is a signal: live, mention, event, status, selected. There
is one way per job: one hover, one selection, one accent, one component. Space
groups; a line separates only when a gap cannot. Only the live indicator moves
on its own; everything else moves because the user did something, and finishes
fast. Words are design: short, warm, plain, sentence case.

## Tokens

Use tokens only, by name. Every colour token has a dark and a light value,
switched by `data-theme` on the root (defaulting to the system).

### Colour

Tones step from darkest to lightest: `canvas` (window, feed), `surface` (rail,
composer, cards, inputs), `raised` (hover, chips, active chrome), `overlay`
(popovers, menus, tooltips; always with a 1px `line`). Hover moves one tone up,
pressed two. `scrim` sits behind dialogs; `media-scrim` is the same dark wash in
both themes, behind anything laid over images or video.

Text is `ink` (body, headings), `ink-soft` (secondary, timestamps, idle icons),
or `ink-faint` (placeholders, disabled, metadata available another way). Lines
are `line-soft` inside a surface and `line` on inputs and overlays.

The accent is one colour meaning "selected, active, or about you": `accent`
(fills), `accent-hover`, `accent-ink` (as text or icon), `accent-soft` (tinted
rows), `on-accent` (text on fills). Users may replace it; only its hue and
chroma are kept, so the set stays readable.

Status colours are `live`, `positive`, `caution`, `negative`, `info`. Live and
negative share a hue; shape tells them apart (a dot or pill is live). Events
have `event-*`, one per Twitch event, shown as a 3px bar and a 10% tint, never a
fill. A chatter's Twitch colour is lightness-clamped per theme so it reads; a
chatter with no colour is `ink-soft` grey everywhere.

### Type, space, shape

Atkinson Hyperlegible Next for everything read; Cascadia Mono for IDs and
payloads. The scale is `hero` (greetings), `heading` (page titles), `title`
(names, card and dialog titles), `body` (UI text), `small` (descriptions,
tooltips, chips), `micro` (badges, counts). The feed sizes in `em` from the
user's chat text size, so everything in a row scales with it.

Space is the 4px scale. Radius grows with the thing: `xs` (only nested in `sm`),
`sm` (controls), `md` (popovers, cards, composer), `lg` (dialogs, big cards),
`round` (avatars, pills, badges). Control heights are `control-sm/md/lg`;
icon-only controls are square with a hit target of at least 32px. Motion is
`snap` (colour changes), `quick` (small moves, popovers), `settle` (panes,
pages), always `ease-out`.

### Pictures and icons

People and channels are `Avatar`: round for chatters in the feed, square (`xs`)
in the rail, inbox channel line, and beside a multi-line block. Pictures of
content are `Artwork` and keep their native shape, never cropped to another one:
`boxart` 3:4, `video` 16:9; a new kind of picture is a new shape there. Artwork
sits on `raised` while loading, and its radius follows where it sits (`xs`
inline in a row, `md` on its own, none when it bleeds to a card's edge).
Anything laid over it uses `media-scrim`.

Icons are Lucide and inherit text colour: 16 on every control and menu item, 20
in headers and rail tiles, 24 in empty states; a glyph inside a chip or badge
sizes with its text; window controls follow Windows at 12.

## Building

Tokens and Tailwind only: no raw hex, shadows, gradients, arbitrary values, or
new `@utility` rules. Values that must follow runtime state (chat text size) are
CSS variables set once where that state lives. One component per file;
primitives live in `src/components/ui/` and feature code composes them without
restyling. A missing look is a new variant on the primitive.

Tooltips are the app's own, never the native `title`: an element carries
`data-tip` and one host shows it after a short delay, above the element, or
below it when above would reach the title bar; tips never cover the title bar. A
tip only says what is not already on screen: the name of an icon or image, a
full date, hidden detail. Visible labels and usage hints get none. Icon-only
controls also carry an `aria-label`.

Overlays are `overlay` with a 1px `line`, open 4px below what opened them (8px
when beside it or above it, as tooltips and rail popovers are), stay inside an
8px viewport margin, and close on Escape or outside click. The opener toggles.
One menu, one popover, and one dialog at a time; Escape closes the topmost and
focus returns where it came from.

Choosing from a long list is a `Combobox`. The field always shows the current
value (or its placeholder when none, with × to clear); focus opens the list
attached below and selects the text so typing filters it; one row is always
highlighted, arrows and hover move it, Enter picks it; focus never leaves the
field; Escape, Tab, or clicking away close it unchanged.

Fading means unusable: 40% for anything that can't be used or is finished
(disabled controls, resolved AutoMod holds, a dragged rail row). Something
switched off but still editable is not faded; its state shows in its own
control. Pressed filled buttons dip to 90%; artwork fades to 80% on hover.

Feedback happens where the action happened. A toast only when the result is out
of view; errors sit next to what failed. Layout is intrinsic: no breakpoints or
media queries, flex wraps and grids auto-fill, usable at the window's minimum
size.

## The feed

Every entry is one `FeedItem`, which owns all row layout. Each kind (message,
event) only supplies its parts: tone, tile, notes, overlay, content.

Each row has one tone, in precedence: held by AutoMod (`caution`), mentions you
(`accent`), cheer (`event-bits`), reward (`event-channel-points`), first message
(`line` on `surface`), event (its colour), plain. Selected adds an `accent`
outline. Hover lifts the row one tone.

In shared chat, a message sent in a partner channel shows that channel's avatar
at badge size, named in its tooltip: square before the badges by default, round
on the bottom-right corner of the chatter tile when spacious.

Notes sit above the message, never beside the name: AutoMod reason, "Cheered N
bits", reward, "First message", then the reply line with a connector down to the
message. Notes start where the message text starts.

There are two layouts. Default (compact in code) is one line per message with an
optional timestamp column. Spacious (comfortable in code) groups a chatter's
messages (same chatter, within seven minutes of the group's first message, same
day, same shared chat channel, nothing between) under one header with a tile in
a gutter; the tile sits centred on the first two lines of every row. Replies,
holds, cheers, rewards, and first messages always start a group. The gap before
each group is the user's group spacing. Every feed and the settings preview
follow the user's text size, group spacing, zoom, and density.

The chatter tile shows the chatter's Twitch avatar, fading in once it has loaded
(at once when the browser already has it). While the chatter is being looked up
it is only the tinted tile, like loading artwork. A chatter without an avatar, a
failed image, or real avatars off shows a blobatar drawn locally from the user
ID, in the hue of their name colour (grey without one), tinted behind with the
same colour; the blobatar moves only while its row is hovered or selected.

Cheermotes render inline at emote size with the amount after them in the tier's
colour, clamped like a chatter colour; under reduced motion they show their
still image. Deleted messages stay quiet: muted text and "(deleted)", nothing
added that would paint the feed or move it during a mass cleanup. Times show
clock time today, "Yesterday at" then the date for older; hovering any time
shows the full date. Day dividers mark where the date changes.

## Keyboard and focus

Everything reachable by mouse has a key; bindings live in
`src/default-keymap.json` and show in tooltips and Settings → Keyboard. Ctrl
acts on channels and their browser tabs, like a browser's tab keys; Alt toggles
app-wide modes. Never Ctrl+Alt: on many layouts it is AltGr and types a
character instead.
`:focus-visible` draws a 2px `accent` outline; text fields show focus through
their border; mouse clicks never show the outline. Focus returns to the composer
when an overlay closes.

## Voice

Sentence case. Buttons say what happens ("Pin channel", never "OK"), and the
result keeps the word ("Pinned"). Errors are direct and say what to do, without
apology. Empty states invite in one line. Fixed vocabulary: channel, chatter,
pin, live, Link, Inbox, Explore, AutoMod, raid, bits, shoutout.

## Accessibility

`ink` and `ink-soft` keep at least 4.5:1 contrast; `ink-faint` only for
information also available another way. Colour is never the only signal. Every
image has `alt`. Reduced motion turns transitions and idle animation off.
Everything works from the keyboard.
