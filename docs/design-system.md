# Deatch design system

Deatch is where you keep every chat you care about open at once. Moderators,
regulars, and streamers spend hours in it. The design has one promise: it should
feel like a warm, well-lit room you want to stay in, where switching between
conversations is effortless and nothing ever gets in the way of reading.

This document is the source of truth for how Deatch looks, moves, and behaves.
Code follows it. When code and this document disagree, fix the code.

---

## Part 1. Character

### 1.1 The feeling

Three words describe every screen: **warm, calm, quick**.

- **Warm.** Surfaces are tinted plum rather than grey. Corners are round. Type
  is soft-edged and generous. Nothing is clinical.
- **Calm.** Chat is loud; the interface is quiet. Chrome recedes so messages,
  names, and emotes carry the energy. Colour appears only when it means
  something.
- **Quick.** Every common action is one click or one keystroke away, and the
  response is immediate. Nothing bounces, nothing waits for an animation.

### 1.2 Flat, with depth from tone

There are no shadows, no gradients, no blur, no glass. Depth comes from stepping
between tones on a single warm scale, and from 1px lines where a tone step alone
would be ambiguous. Overlays sit on the lightest tone with a line around them.
Modals darken the room behind them.

This keeps the interface honest and light to render, and lets user-chosen
colours slot in without breaking anything.

### 1.3 The memorable thing

Boldness goes in one place: **the channel rail**. It is the heart of "be
everywhere at once". Round avatars ring when live, badge when someone mentions
you, and expand into a full roster with one keystroke. Everything else in the
app is deliberately quiet so the rail can be alive.

### 1.4 Principles for every decision

1. **Reading comes first.** If a choice makes chat harder to read, it is wrong.
2. **One way per job.** One hover treatment, one selected treatment, one radius
   per component class, one accent.
3. **Colour is meaning.** Neutral tones build structure. Anything with chroma is
   a signal: live, mention, event, status, or "this is selected".
4. **Space groups; lines separate.** Prefer a gap to a divider. Use a line only
   when a gap cannot do the job.
5. **Motion answers the user.** Only the live indicator moves on its own.
   Everything else moves because the user did something, and finishes fast.
6. **Words are part of the design.** Short, warm, plain. Verbs on buttons.
   Sentence case everywhere.

---

## Part 2. Foundations

### 2.1 Colour

All colours are OKLCH. Neutrals carry a faint plum tint (hue 325) so dark
surfaces read warm rather than grey, and light surfaces read like soft paper
rather than white. The tint is low enough that Twitch's per-user name colours
and emotes sit on it without clashing.

Every token has a dark and a light value. Components reference tokens only.

#### Tones

Four tones build every layout. Hover moves one tone up. Pressed moves two.

| Token     | Dark                    | Light                    | Use                                                               |
| --------- | ----------------------- | ------------------------ | ----------------------------------------------------------------- |
| `canvas`  | `oklch(0.13 0.012 325)` | `oklch(0.965 0.006 325)` | Window background, title bar, feed background                     |
| `surface` | `oklch(0.17 0.012 325)` | `oklch(0.995 0.003 325)` | Rail, composer, cards, inputs, secondary buttons                  |
| `raised`  | `oklch(0.22 0.012 325)` | `oklch(0.935 0.006 325)` | Hovered surface, chips, active chrome, skeleton blocks            |
| `overlay` | `oklch(0.26 0.014 325)` | `oklch(0.995 0.003 325)` | Popovers, menus, tooltips, user card. Always has a `line` border. |

`scrim` (behind modals): `oklch(0.10 0.02 325 / 0.6)` dark,
`oklch(0.25 0.02 325 / 0.4)` light.

#### Text

| Token       | Dark                    | Light                   | Min contrast | Use                                                    |
| ----------- | ----------------------- | ----------------------- | ------------ | ------------------------------------------------------ |
| `ink`       | `oklch(0.97 0.005 325)` | `oklch(0.20 0.02 325)`  | 12:1         | Message body, headings, primary labels                 |
| `ink-soft`  | `oklch(0.74 0.01 325)`  | `oklch(0.46 0.02 325)`  | 5:1          | Timestamps, descriptions, secondary labels, idle icons |
| `ink-faint` | `oklch(0.56 0.01 325)`  | `oklch(0.62 0.015 325)` | 3:1          | Placeholders, disabled, decorative metadata            |

Chatter names use Twitch's colour, clamped: dark theme minimum lightness `0.64`,
light theme maximum lightness `0.58`. Clamp lightness only; keep the hue so
people stay recognisable.

#### Lines

| Token       | Dark                    | Light                   | Use                                                    |
| ----------- | ----------------------- | ----------------------- | ------------------------------------------------------ |
| `line-soft` | `oklch(0.23 0.012 325)` | `oklch(0.91 0.008 325)` | Dividers inside a surface, rail edge, composer top     |
| `line`      | `oklch(0.31 0.014 325)` | `oklch(0.85 0.01 325)`  | Input borders, overlay borders, card edges when needed |

#### Accent

One accent, default `#9481ff` (a soft violet). It means "selected, active, or
about you". Two shades so it works both as a fill and as text.

| Token          | Dark                     | Light                    | Use                                                             |
| -------------- | ------------------------ | ------------------------ | --------------------------------------------------------------- |
| `accent`       | `oklch(0.58 0.18 287.5)` | `oklch(0.54 0.18 287.5)` | Filled buttons, selection pill, toggles on, unread divider      |
| `accent-hover` | `oklch(0.64 0.18 287.5)` | `oklch(0.48 0.18 287.5)` | Hovered filled button                                           |
| `accent-ink`   | `oklch(0.82 0.13 287.5)` | `oklch(0.46 0.18 287.5)` | Accent as text or icon: active tab, links, mention name         |
| `on-accent`    | `oklch(0.99 0 0)`        | `oklch(0.99 0 0)`        | Text on `accent`                                                |
| `accent-soft`  | `accent` at 14%          | `accent` at 12%          | Tinted backgrounds: selected row, mention row, active rail tile |

Users may replace the accent in Settings. Only the hue and chroma of the picked
colour are kept; lightness is fixed per shade, so a custom accent always
produces a coherent, readable set.

#### Status

| Token      | Dark                   | Light                  | Meaning                                                          |
| ---------- | ---------------------- | ---------------------- | ---------------------------------------------------------------- |
| `live`     | `oklch(0.68 0.20 25)`  | `oklch(0.58 0.21 25)`  | Streaming now. Dot on the avatar's edge, live pill, viewer count |
| `positive` | `oklch(0.74 0.15 150)` | `oklch(0.52 0.15 150)` | Done, connected, approved, Watch in auto mode                    |
| `caution`  | `oklch(0.80 0.15 80)`  | `oklch(0.60 0.15 75)`  | Held by AutoMod, Watch in manual mode, slow mode, reconnecting   |
| `negative` | `oklch(0.66 0.19 20)`  | `oklch(0.54 0.20 20)`  | Destructive actions, errors, denied, mention badge               |
| `info`     | `oklch(0.74 0.12 250)` | `oklch(0.52 0.13 250)` | Neutral system notices                                           |

`live` and `negative` are neighbours on the wheel on purpose: both mean
"attention". Shape tells them apart. Live is always a dot, pill, or a line of
text next to a channel. Negative is always a filled button, badge, or text.

#### Events

Each Twitch event has its own colour so the eye recognises the event before
reading it. Event colour appears as a 3px left bar and a 10% tint. Never as a
fill.

| Token                  | Dark                   | Light                  | Event                     |
| ---------------------- | ---------------------- | ---------------------- | ------------------------- |
| `event-sub`            | `accent-ink`           | `accent-ink`           | Subscription, resub, gift |
| `event-raid`           | `oklch(0.78 0.16 60)`  | `oklch(0.60 0.16 60)`  | Incoming raid             |
| `event-announce`       | `oklch(0.80 0.12 195)` | `oklch(0.55 0.12 195)` | Announcement              |
| `event-charity`        | `oklch(0.72 0.18 15)`  | `oklch(0.56 0.18 15)`  | Charity                   |
| `event-shoutout`       | `oklch(0.76 0.12 230)` | `oklch(0.54 0.13 230)` | Shoutout                  |
| `event-follow`         | `oklch(0.82 0.16 145)` | `oklch(0.55 0.16 145)` | Follow                    |
| `event-bits`           | `oklch(0.85 0.15 90)`  | `oklch(0.62 0.15 85)`  | Cheer                     |
| `event-channel-points` | `oklch(0.74 0.22 340)` | `oklch(0.56 0.22 340)` | Reward redemption         |

### 2.2 Typography

#### Family

**Atkinson Hyperlegible Next** for everything users read. It was designed for
legibility over long sessions: open apertures, unambiguous `I l 1` and `O 0`,
generous x-height. It is warm without being cute and renders cleanly at 13 to
16px, which is where chat lives. Bundled as variable WOFF2 (weights 400 to 700),
about 60KB.

**Cascadia Mono, Consolas, monospace** for IDs, payloads, and the login code.
Not bundled.

Emotes and badges are images and set the rhythm of the line; the typeface must
not fight them. Atkinson's even stroke and round forms sit next to pixel-art
emotes better than a geometric sans would.

#### Scale

UI type is in `rem`. Feed type is in `em` relative to the user's chat size
(default 15px, range 12 to 22, changed with Ctrl + wheel over the feed).

| Token     | Size / line | Weight | Use                                                      |
| --------- | ----------- | ------ | -------------------------------------------------------- |
| `hero`    | 32 / 40     | 700    | Login greeting, Explore greeting                         |
| `heading` | 20 / 28     | 600    | Page titles: Settings, Inbox, Explore sections           |
| `title`   | 16 / 24     | 600    | Channel name in header, card titles, dialog titles       |
| `body`    | 15 / 22     | 400    | UI text, settings labels, menu items, inputs             |
| `strong`  | 15 / 22     | 600    | Buttons, active nav, chatter names, rail names           |
| `small`   | 13 / 18     | 500    | Descriptions, tooltips, chips, tab labels, rail sublines |
| `micro`   | 11 / 16     | 600    | Badges, timestamps in chrome, version, viewer counts     |

Feed: body `1em / 1.5`. Timestamps `0.8em`, `ink-soft`, tabular. Reply preview
and event sublines `0.85em`. Emotes `1.7em` tall on the same line height;
emote-only messages grow emotes to `2.4em`.

#### Rules

- Sentence case. No all-caps, no tracked-out labels, no eyebrow labels.
- Measure for UI prose: 65 characters max (`max-w-prose`).
- Numbers that change use tabular figures.
- Chrome truncates with an ellipsis. The feed wraps.

### 2.3 Space

4px base. These are the only spacing values.

| Step | px | Use                                                 |
| ---- | -- | --------------------------------------------------- |
| 1    | 4  | Icon-to-label inside a button, badge padding        |
| 2    | 8  | Between controls in a group, input padding          |
| 3    | 12 | Card padding, menu item padding, rail row padding   |
| 4    | 16 | Panel padding, between form rows, feed side padding |
| 6    | 24 | Between sections, page side padding                 |
| 8    | 32 | Empty-state spacing                                 |
| 12   | 48 | Login vertical rhythm                               |

### 2.4 Shape

Round is the character. Radii scale with the size of the thing.

| Token   | px   | Use                                                                                          |
| ------- | ---- | -------------------------------------------------------------------------------------------- |
| `xs`    | 6    | Only for elements nested inside an `sm` container: segments, key caps, chips over thumbnails |
| `sm`    | 8    | Buttons, inputs, chips, menu item hover, message row hover                                   |
| `md`    | 12   | Cards, popovers, menus, toasts, composer, user card                                          |
| `lg`    | 16   | Dialogs, settings groups, emote picker, explore cards                                        |
| `round` | 9999 | Avatars, badges, pills, toggle, live dot, selection pill                                     |

A container never mixes radii with its children except `round` avatars inside
`md` cards.

### 2.5 Size

| Control | Height | Notes                                                |
| ------- | ------ | ---------------------------------------------------- |
| `sm`    | 32     | Row toolbars, chip remove, dense inline actions      |
| `md`    | 36     | Default buttons, inputs, segments, menu items        |
| `lg`    | 44     | Composer field, login button, channel header actions |

Icon-only controls are square. Minimum hit target 32×32.

Fixed widths:

| Region          | px                |
| --------------- | ----------------- |
| Rail, collapsed | 72                |
| Rail, expanded  | 280               |
| Inbox popover   | 480 × 640 max     |
| Context menu    | 220 min, 300 max  |
| User card       | 340               |
| Tooltip         | 300 max           |
| Toast           | 360               |
| Dialog          | 440               |
| Page content    | 1040 max, centred |

### 2.6 Iconography

Lucide, stroke width 1.75 (slightly lighter than default to match Atkinson's
weight). Sizes: 16 in buttons, menus, and text; 20 in the channel header and
rail tiles; 24 in empty states and login. Icons inherit their container's text
colour. The only self-coloured icons are status dots and event icons.

### 2.7 Motion

| Token    | Duration | Curve                        | Use                                                                    |
| -------- | -------- | ---------------------------- | ---------------------------------------------------------------------- |
| `snap`   | 90ms     | linear                       | Hover and press colour changes                                         |
| `quick`  | 160ms    | `cubic-bezier(0.2, 0, 0, 1)` | Toggle knob, segment slide, popover fade-and-rise, rail selection pill |
| `settle` | 240ms    | `cubic-bezier(0.2, 0, 0, 1)` | Rail expand/collapse, pane slide, page swap, toast enter               |

Popovers fade in and rise 4px; they vanish instantly. Panes slide from their
edge. Pages cross-fade. Toasts drop in from above and fade out. The feed appends
without motion.

Nothing moves on its own. Every transition answers a click, a hover, or a
keypress.

---

## Part 3. Structure

### 3.1 App shell

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ● Deatch                                                     ✉2 │ ─  □  ✕  │  40  title bar, canvas
├──────┬─────────────────────────────────────────────────────────────────────┤
│  ‹   │  (avatar) streamer   ● Live · 4.2K   Just Chatting   ⋯  ↗  ⊟      │  56  channel header, canvas
│ (◎)  │─────────────────────────────────────────────────────────────────────│
│ (◎)3 │                                                                     │
│ (◎)  │  12:01  name: message with emotes                                   │
│  +   │  12:01  name: message                                               │
│──────│ ▎12:02  name: @you mentioned here                                   │
│ (◎)  │  ····················  new messages  ·························       │
│ (◎)  │  12:03  name: message                                               │
│ (◎)  │                                                                     │
│──────│                                                                     │
│  👁  │                                                                     │
│ (◎)  │                                                                     │
│──────│                                                                     │
│  ⌕   │  ┌──────────────────────────────────────────────────────────────┐   │
│  ⚙   │  │ Say something…                                        ☺  ➤ │   │  composer, surface
│ (me) │  └──────────────────────────────────────────────────────────────┘   │
└──────┴─────────────────────────────────────────────────────────────────────┘
  72                                  chat pane
```

Regions from left to right, top to bottom:

- **Title bar** (40px, `canvas`). Wordmark and version left, drag region, then
  on the right the Inbox toggle with its unread badge, a 1px `line-soft`
  divider, and the window controls. Toggle and controls share one 46px-wide
  button style: `ink-soft`, `raised` + `ink` on hover, held in that state while
  open. Close turns `negative` on hover. The channel name belongs to the channel
  header, where it has room.
- **Rail** (72px collapsed, 280px expanded, `surface`, 1px `line-soft` on the
  right). The switcher. Detailed in §3.2.
- **Channel header** (56px, `canvas`, 1px `line-soft` below). Avatar 32, name in
  `title`, live pill with viewer count, game in `ink-soft`, right-aligned
  actions. Cross-fades on channel switch.
- **Feed** (fills, `canvas`). Rows bleed to the left edge so their status bar
  and hover fill touch the rail's border; 16px padding on the right.
- **Composer** (min 44px field inside 12px padding, `surface` top edge with 1px
  `line-soft`). Field is `surface` with `line` border, `md` radius. Emote and
  send buttons inside on the right. Reply chip appears above the field inside
  the same padding.
- **Inbox** opens as a popover under the title bar, centred on its button.
  **Settings** and **Explore** open as full pages replacing the chat pane. Your
  account row has no page; right-click it for Log out.

### 3.2 The rail

The rail is a vertical list of round 40px avatars in 56px rows, grouped:

1. Pinned channels, then "+"
2. Live followed channels not pinned
3. Watch channels (browser-linked), headed by the Watch mode tile
4. The channel you are viewing but have not pinned (dashed ring)
5. Explore, Settings, your account

Groups are separated by a 1px `line-soft` inset 20px each side. Groups 1 through
4 scroll together; the collapse chevron above them and group 5 stay fixed. Inbox
is not a rail row; it lives in the title bar.

#### Row anatomy

```
▎ (avatar)●          ▎  selection bar: 4px wide, full row height, `ink`, round ends, left edge
   40px   ◦          ●  mention badge: negative fill, micro 700, top-right, 2px surface ring
                     ◦  presence dot: 10px circle on the avatar's bottom-right edge, 2px surface ring.
                        `live` when streaming, `positive` when the person is online in Deatch, `ink-faint` when neither.
```

| State               | Pill                | Avatar                                             |
| ------------------- | ------------------- | -------------------------------------------------- |
| Rest, offline       | none                | grey presence dot                                  |
| Rest, live          | none                | `live` presence dot                                |
| Online in Deatch    | none                | `positive` presence dot (today: only your own row) |
| Unread              | 4 × 8, `ink-soft`   |                                                    |
| Hover               | unchanged           | row gets a `raised` rounded fill, nothing moves    |
| Selected            | 4 × full row, `ink` |                                                    |
| Mentioned           |                     | badge with count, single bounce on arrival         |
| Dragging (reorder)  |                     | 40% opacity; drop line 2px `accent` between rows   |
| Viewing, not pinned |                     | dashed 2px `line` ring; pin via the context menu   |
| Watch, muted        |                     | 16px `negative` mute badge, top-right, 2px ring    |

Tool tiles (Explore, Settings, "+", Watch) are 40px `round` tiles on `raised`
with a 20px `ink-soft` icon. Hover: `overlay` tone, `ink`. Active: `accent-soft`
with `accent-ink` icon. Watch tints `positive` in auto and `caution` in manual.

#### Expanded rail

Ctrl+B, or the chevron at the top of the rail, expands it to 280px over
`settle`. The avatar stays 40px and stays put; two text lines fade in beside it
over the same `settle`, and fade out while the width closes, so nothing jumps in
either direction:

```
▎ (◎)  streamer name                        3
       Just Chatting · 4.2K                 ●
```

Line one: name in `strong`, right side mention badge. Line two: game and viewer
count in `small ink-soft`; offline channels show "Offline" or last-live time.
Live channels keep the dot. Unread shows a 6px `ink` dot after the name when
there is no mention badge. Tooltips are off when expanded.

The expanded state persists across restarts.

### 3.3 Chat pane

The feed uses a two-column grid: timestamp column (auto, hidden if the setting
is off), then content. Rows have 4px vertical padding, 12px left padding after a
3px status bar, `sm` radius on the right corners. Row hover is `raised`, two
tones above the canvas the feed sits on, so it reads at a glance; a row that
already sits on `surface` hovers to `overlay`.

Row treatments, one at a time, in this precedence:

| State             | Left bar               | Background    | Extra                                           |
| ----------------- | ---------------------- | ------------- | ----------------------------------------------- |
| Held by AutoMod   | `caution`              | caution 12%   | Reason line + Approve / Deny `sm` buttons       |
| Mentions you      | `accent`               | `accent-soft` | Your handle in `accent-ink strong`              |
| Reward redemption | `event-channel-points` | event 10%     | Reward title line above the message             |
| First message     | `line`                 | `surface`     | "First message" chip after the name             |
| Selected (keys)   | unchanged              | `accent-soft` | 2px `accent` outline, `sm` radius               |
| Deleted           | unchanged              | unchanged     | 50% opacity, body swapped for "Message deleted" |

Hovering a row reveals a floating toolbar at its top-right: reply, react, copy,
more. `overlay` tone, 1px `line`, `sm` radius, `sm` ghost buttons.

Unread divider: a dotted 1px `accent` line with a centred `micro` pill "New
messages" on `canvas`. Clears on Escape or when you send.

When scrolled up, a `round` pill "↓ New messages" floats 16px above the composer
in `accent`. Clicking it jumps to the bottom.

### 3.4 Pages

**Explore.** Greeting in `hero` ("Good evening, name"), search field `lg` below
it, then "Live now" as a grid of stream cards (`lg` radius, `surface`, thumbnail
16:9, avatar 32 + name + game + viewer count). Search results replace the grid.
Clicking a card opens the channel and adds it to the rail as "viewing".

**Settings.** Left nav of section rows (icon + label, `accent-soft` fill on the
active one), 220px when there is room. Content keeps a 384px minimum, so in a
narrow window the nav gives way first: labels truncate, then only icons remain
at 64px. Content 1040px max with 20px padding. Each section is a `lg` card on
`surface` containing rows of label + description on the left and control on the
right, 56px min height, separated by 1px `line-soft`. Sections: Notifications,
Feed, Moderation, Triggers, Appearance, Keyboard, Advanced.

**Inbox.** A popover opening 4px below the title bar, centred on the Inbox
button and sliding inward only as far as the 8px viewport margin demands, 480px
wide, capped at 640px tall, scrolling inside. Header 56px with "Inbox" in
`title` and a "Mark all read" ghost button. One flat list, newest first, so a
busy channel never buries the others. Each row: the mentioning chatter's avatar
32 on the left, then a `small` meta line (chatter name in their colour, "in
channel" in `ink-faint`, relative time right-aligned) above the message in
`body` clamped to two lines. Unread rows sit on `accent-soft`. Clicking a
mention jumps to it in that channel and closes the popover. Outside click or
Escape closes it.

**Login.** Centred column 400px wide on `canvas`. Wordmark, `hero` "Welcome to
Deatch", one `body ink-soft` line, `lg` accent button "Log in with Twitch". The
device code, when shown, sits in a `lg` card in mono at 28px with a copy button.

### 3.5 Overlays

| Kind         | Tone                 | Radius | Size      | Dismiss                           |
| ------------ | -------------------- | ------ | --------- | --------------------------------- |
| Context menu | `overlay`            | `md`   | 220 min   | Escape, outside click, item click |
| Popover      | `overlay`            | `md`   | content   | Escape, outside click             |
| Tooltip      | `overlay`            | `sm`   | 300 max   | Pointer leaves                    |
| User card    | `overlay`            | `md`   | 340       | Escape, outside click             |
| Emote picker | `overlay`            | `lg`   | 400 × 440 | Escape, outside click, pick       |
| Dialog       | `surface` on `scrim` | `lg`   | 440       | Escape, Cancel                    |

Popovers and menus opened from a button sit 4px below it. Each declares its
horizontal alignment to the button (start, center, or end); end-aligned ones
shrink rather than drift when the window is narrower than they are, the others
slide to stay inside an 8px viewport margin. The button that opened an overlay
also closes it: a second click toggles, never reopens. All overlays have a 1px
`line` border. Only one context menu, one popover, and one dialog may be open at
once; opening a new one closes the previous. Escape always closes the topmost
surface and returns focus to where it came from.

---

## Part 4. Components

One implementation per component. Feature code composes; it never restyles.

### Button

Variants `accent`, `neutral`, `ghost`, `danger`. Sizes `sm` `md` `lg`. `sm`
radius. `strong` type. 16px icon, 6px gap.

| Variant   | Rest                              | Hover           | Pressed         |
| --------- | --------------------------------- | --------------- | --------------- |
| `accent`  | `accent` fill, `on-accent` text   | `accent-hover`  | `accent` at 90% |
| `neutral` | `surface`, 1px `line`, `ink` text | `raised`        | `overlay`       |
| `ghost`   | transparent, `ink-soft` text      | `raised`, `ink` | `overlay`       |
| `danger`  | `negative` fill, `on-accent` text | lighter 6% L    | 90%             |

Disabled: 40% opacity, no hover. Loading: label swaps for a 16px spinner, width
held. One `accent` button per view.

### Icon button

Square `ghost` or `neutral` button. Always has a tooltip and an `aria-label`. In
the channel header uses `lg` size.

### Toggle

40 × 22 track, `round`. Off: `line` track, `ink-soft` knob 18px. On: `accent`
track, `on-accent` knob. Knob travels over `quick`. Label on the left,
description under it in `small ink-soft`.

### Segmented control

`surface` container with 1px `line`, `sm` radius, 3px padding. Segments `sm`
height, `small` weight 600. Active segment `raised` with `ink`; the active fill
slides over `quick`.

### Text field

`md` height (or `lg`), `surface`, 1px `line`, `sm` radius, 12px padding, `body`.
Placeholder `ink-faint`. Hover border `ink-faint`. Focus border `accent`, no
ring. Invalid border `negative` with `small negative` helper text. Optional
leading icon 16px `ink-soft`. Optional clear button appears when non-empty.

### Composer

`lg` text area that grows to 5 lines, `md` radius. Emote button and send button
inside on the right, `sm` ghost. Send becomes `accent` when there is text. Reply
chip above: avatar 16, "Replying to name", message preview truncated, × to
cancel. Character count appears at 80% of the limit in `micro ink-faint`,
`negative` at the limit. Autocomplete (emotes, mentions, commands) opens as a
popover above the field with `md` rows: image or avatar 20, label,
`small ink-soft` hint.

### Chip

`sm` height, `raised`, `round`, `small`, 10px padding. Removable chips show × on
the right. Selected chips use `accent-soft` and `accent-ink`.

### Badge

`round`, `micro` 700, 18px min, 5px padding, tabular. Mention: `negative` fill,
`on-accent`. Neutral count: `raised`, `ink`. Live pill: `live` 14% tint, `live`
text, dot 6px, "Live · 4.2K".

### Avatar

Always round. 24, 32, 36, 40, 64. Fallback `raised` with initial in
`ink-soft strong`. An optional presence dot (`live`, `online`, `offline`; sized
to the avatar, cut out with a 2px `surface` ring) is part of the avatar
component so every avatar in the app agrees.

### Navigation item

`md` height, `sm` radius, 12px padding, icon 16 + label `strong`. Rest
`ink-soft`. Hover `raised` `ink`. Active `accent-soft` `accent-ink`. Used in
Settings nav and Explore tabs. Horizontal tabs use a 3px `accent` underline pill
instead of a fill.

### Menu

`overlay`, 1px `line`, `md` radius, 6px padding. Items `md` height, `body`, `sm`
radius, icon 16 with 10px gap, shortcut hint right in `small ink-faint`. Hover
`raised`. Destructive items `negative` text, last, after a divider. Divider 1px
`line-soft` with 6px margin. Submenu opens right after 120ms hover.

### Tooltip

`overlay`, 1px `line`, `sm` radius, 8px 10px padding, `small`. 300ms delay,
instant hide. Shortcut on the right in `ink-faint`.

### Toast

Top-right of the main area, 8px below the channel header line so the composer
and newest messages stay clear. 360px, `overlay`, 1px `line`, `md` radius, 12px
padding. Icon 16 in status colour carries the meaning; no bars or fills. `body`
text, one ghost action. 5s auto-dismiss except `negative`. Max 3 stacked.

### Banner

Full width above the feed, `raised`, 12px 16px padding, `body`, status icon
left, actions right as `sm` buttons. One banner at a time: raid > connection >
update.

### Dialog

Centred, 440px, `surface`, 1px `line`, `lg` radius, 24px padding. `title`,
`body ink-soft` text, fields, then actions right-aligned: `neutral` Cancel, then
the primary. Destructive primary is `danger`. Escape cancels.

### Card

`surface`, `lg` radius, 16px padding. No border in dark; 1px `line-soft` in
light where `surface` meets `canvas` with too little contrast. Hover, if
clickable: `raised`.

### Empty state

Centred, 360px max: 24px icon `ink-faint`, `title`, `body ink-soft`, one
`accent` button. Copy invites: "Pin a channel and it lives here."

### Loading

Skeletons in the shape of the thing, `raised`, pulsing to `overlay` over 1.2s.
Spinner 20px 2px `ink-soft` only for indeterminate whole-screen waits.

### Message row, Event row, Unread divider

Specified in §3.3. Each chat badge sits in its own 1.25em square tile with `xs`
radius before the name, filled with `ink` at 15% rather than a fixed tone so it
lifts the same amount on canvas, hovered, first-message, and mention rows in
both themes, so a row reads as "badges · name · message" instead of loose
images. Tiles sit 0.2em apart; the artwork is the 4x asset inset 0.15em so it
stays crisp on scaled displays. The tile is never taller than the text line and
hangs 0.15em below the baseline to centre on x-height. An event row has exactly
the anatomy of a message row so the columns line up: timestamp in the same left
column, then an event-coloured icon where a message would show badges, then the
system text at regular weight and feed size. The tint and 3px bar carry the
event colour; the text does not shout. Attached messages render below at feed
size.

---

## Part 5. Behaviour

### 5.1 Keyboard

Everything reachable by mouse has a key. Shortcuts show in tooltips and menus.

| Keys                          | Action                                                                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Ctrl+K                        | Quick switch: fuzzy search across pinned, live, and recent channels                                                         |
| Ctrl+1 … Ctrl+9               | Jump to the nth channel in rail order                                                                                       |
| Alt+↑ / Alt+↓                 | Previous / next channel in rail order                                                                                       |
| Ctrl+B                        | Expand or collapse the rail                                                                                                 |
| Ctrl+I                        | Open or close Inbox                                                                                                         |
| Ctrl+,                        | Settings                                                                                                                    |
| Ctrl+Shift+E                  | Explore                                                                                                                     |
| Ctrl+E                        | Emote picker                                                                                                                |
| Alt+W / Alt+M / Alt+A / Alt+S | Watch: toggle, mute current, mute all, mute others                                                                          |
| Alt+T                         | Always on top                                                                                                               |
| Shift+↑ / ↓                   | Enter message selection, then ↑/↓ to move                                                                                   |
| Enter or R                    | Reply to selected message                                                                                                   |
| C                             | Copy selected message text                                                                                                  |
| Escape                        | Close topmost overlay, else clear selection, else clear unread divider, else leave Settings or Explore for the last channel |
| Ctrl + wheel                  | Chat text size, with a transient readout                                                                                    |

Focus returns to the composer whenever an overlay closes, unless the user opened
it from the feed with the keyboard. Opening a channel focuses its composer;
opening Explore focuses its search field. Rail rows and icon buttons never take
focus on click, so typing continues where it was.

### 5.2 Pointer

Click a rail avatar to switch. Middle-click opens the channel in the browser.
Right-click anywhere meaningful (avatar, message, name, event) opens a menu.
Drag pinned avatars to reorder. Hover a name for 300ms to see a tooltip; click
it for the user card.

### 5.3 Focus

`:focus-visible` draws a 2px `accent` outline offset 2px with the element's
radius. Text fields show focus through their border. Mouse clicks never show the
outline. Menus, autocomplete, and the emote grid use roving focus with arrow
keys.

### 5.4 Feedback

Every action produces one visible result at the place it happened: a button's
label changes, a toggle flips, a row updates. A toast appears only when the
result is somewhere the user cannot see. Errors appear next to the thing that
failed.

---

## Part 6. Voice

- Sentence case for everything.
- Buttons say what happens: "Pin channel", "Ban user", "Approve", "Copy code".
  Never "OK" or "Submit".
- Names stay stable through a flow: "Pin channel" produces "Pinned".
- Errors are direct and helpful: "Couldn't send. Twitch didn't respond, try
  again in a moment." No apologies, no exclamation marks.
- Empty states invite in one line: "Nothing in your inbox. Mentions from every
  channel land here."
- Warm, not chatty. One sentence where one will do.
- Relative time under an hour ("4m"), clock time today, date otherwise. Counts
  abbreviate past 1,000 ("12.4K").
- Fixed vocabulary: channel, chatter, pin, live, Watch (browser-linked), Inbox,
  Explore, AutoMod, raid, bits, shoutout.

---

## Part 7. Accessibility floor

- Text contrast ≥ 4.5:1 for `ink` and `ink-soft`; `ink-faint` only for content
  also available another way.
- Colour never alone: live has a dot and the word; mention rows also bold the
  handle; events carry an icon.
- Every image has `alt`: emote name, badge title, display name.
- Reduced motion shortens all transitions to 0.
- Fully keyboard operable per §5.1.
- Usable at 800×500. Layout is intrinsic: no media or container queries
  anywhere. Rows wrap with flex, card grids use `auto-fill`, and navigation is a
  scrollable strip, so every width lands somewhere sensible without breakpoints.

---

## Part 8. Token reference

Tailwind `@theme` keys. Values per theme in Part 2. Theme is selected with
`data-theme="dark|light"` on the root and defaults to the system preference.

```
--color-canvas  --color-surface  --color-raised  --color-overlay  --color-scrim
--color-ink  --color-ink-soft  --color-ink-faint
--color-line-soft  --color-line
--color-accent  --color-accent-hover  --color-accent-ink  --color-on-accent  --color-accent-soft
--color-live  --color-positive  --color-caution  --color-negative  --color-info
--color-event-sub  --color-event-raid  --color-event-announce  --color-event-charity
--color-event-shoutout  --color-event-follow  --color-event-bits  --color-event-channel-points

--font-sans  "Atkinson Hyperlegible Next", system-ui, sans-serif
--font-mono  "Cascadia Mono", Consolas, monospace

--text-hero 2rem/2.5rem  --text-heading 1.25rem/1.75rem  --text-title 1rem/1.5rem
--text-body 0.9375rem/1.375rem  --text-small 0.8125rem/1.125rem  --text-micro 0.6875rem/1rem

--radius-xs 6px  --radius-sm 8px  --radius-md 12px  --radius-lg 16px

--spacing 4px

--size-control-sm 32px  --size-control-md 36px  --size-control-lg 44px
--size-rail 72px  --size-rail-expanded 280px  --size-header 56px  --size-titlebar 40px

--duration-snap 90ms  --duration-quick 160ms  --duration-settle 240ms
--ease-out cubic-bezier(0.2, 0, 0, 1)
```

User-adjustable in Settings > Appearance: theme (system, dark, light), one
accent colour, and chat text size. Everything else derives.

---

## Part 9. Decisions made

- **Dark and light from day one**, same token names, values swapped by theme
  attribute.
- **Rail expands** with Ctrl+B and persists. Tooltips only in collapsed mode.
- **Channel name lives in a channel header**, not the title bar, so it has room
  for live status and actions.
- **Settings and Explore are pages**; Inbox is a popover. No floating settings
  window.
- **Quick switch (Ctrl+K)** is a first-class feature because "switch quickly" is
  the product's promise.
- **Bundled typeface** chosen for long-session legibility over native look.
- **No shadows anywhere.** Overlays rely on tone plus a 1px line.
- **Accent is user-replaceable**; the rest of the accent family derives from it.

## Part 10. Still open

1. Whether Explore should show followed-but-offline channels, or only live ones.
2. Whether the Inbox popover should also be reachable as a full page for long
   mention histories.
3. Whether to offer a "compact" density preset alongside the default comfortable
   one.
