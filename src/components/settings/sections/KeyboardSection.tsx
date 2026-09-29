import { For } from "solid-js";
import PageBody from "../../ui/PageBody.tsx";
import Card from "../../ui/Card.tsx";
import defaultKeymap from "../../../default-keymap.json" with { type: "json" };

const ACTION_LABELS: Record<string, string> = {
  "channel::cycleNext": "Next channel",
  "channel::cyclePrev": "Previous channel",
  "channel::select1": "Jump to channel 1",
  "channel::select2": "Jump to channel 2",
  "channel::select3": "Jump to channel 3",
  "channel::select4": "Jump to channel 4",
  "channel::select5": "Jump to channel 5",
  "channel::select6": "Jump to channel 6",
  "channel::select7": "Jump to channel 7",
  "channel::select8": "Jump to channel 8",
  "channel::select9": "Jump to channel 9",
  "explore::show": "Open Explore",
  "settings::toggle": "Open or close Settings",
  "rail::toggle": "Expand or collapse the rail",
  "inbox::toggle": "Open or close Inbox",
  "emotePicker::toggle": "Emote picker",
  "quickSwitch::toggle": "Quick switch",
  "watch::toggle": "Watch: follow browser tab",
  "watch::toggleMute": "Watch: mute current tab",
  "watch::toggleMuteAll": "Watch: mute all tabs",
  "watch::muteOthers": "Watch: mute other tabs",
  "view::toggleAlwaysOnTop": "Always on top",
  "panel::close": "Close the open overlay, or leave Settings and Explore",
  "chat::send": "Send message",
  "chat::tabComplete": "Complete a name",
  "chat::recallPrev": "Previous sent message",
  "chat::recallNext": "Next sent message",
};

const KEY_LABELS: Record<string, string> = {
  ctrl: "Ctrl",
  alt: "Alt",
  shift: "Shift",
  meta: "Win",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
  enter: "Enter",
  escape: "Esc",
  tab: "Tab",
};

function keyParts(combo: string): string[] {
  return combo
    .split("-")
    .map((k) => KEY_LABELS[k] ?? (k.length === 1 ? k.toUpperCase() : k));
}

const GROUPS = [
  { title: "Navigation", prefix: ["channel::", "explore::", "settings::"] },
  {
    title: "Panels",
    prefix: [
      "rail::",
      "inbox::",
      "account::",
      "emotePicker::",
      "quickSwitch::",
      "panel::",
    ],
  },
  { title: "Watch", prefix: ["watch::", "view::"] },
  { title: "Chat", prefix: ["chat::"] },
];

type Row = { combo: string; label: string };

function rowsFor(prefixes: string[]): Row[] {
  return Object.entries(defaultKeymap as Record<string, string[]>)
    .flatMap(([combo, actions]) =>
      actions
        .filter((a) => prefixes.some((p) => a.startsWith(p)))
        .map((a) => ({ combo, label: ACTION_LABELS[a] ?? a }))
    );
}

export default function KeyboardSection() {
  return (
    <PageBody
      title="Keyboard"
      lede="Every action has a key. Rebinding lands in a later release."
    >
      <For each={GROUPS}>
        {(g) => (
          <Card>
            <div class="px-5 pt-4 pb-2 text-small text-ink-faint">
              {g.title}
            </div>
            <For each={rowsFor(g.prefix)}>
              {(row) => (
                <div class="flex items-center justify-between gap-6 px-5 h-11 border-t border-line-soft">
                  <span class="text-body text-ink">{row.label}</span>
                  <span class="flex items-center gap-1">
                    <For each={keyParts(row.combo)}>
                      {(k) => (
                        <kbd class="min-w-6.5 h-6 px-1.5 inline-grid place-items-center rounded-xs bg-raised text-small text-ink-soft font-sans">
                          {k}
                        </kbd>
                      )}
                    </For>
                  </span>
                </div>
              )}
            </For>
          </Card>
        )}
      </For>
    </PageBody>
  );
}
