import { type MessageKey, t } from "../../../lib/i18n/index.ts";
import { For } from "solid-js";
import PageBody from "../../ui/PageBody.tsx";
import Card from "../../ui/Card.tsx";
import Kbd from "../../ui/Kbd.tsx";
import defaultKeymap from "../../../default-keymap.json" with { type: "json" };

const ACTION_LABELS: Record<string, MessageKey> = {
  "channel::cycleNext": "SETTINGS_KEYBOARD_CHANNEL_NEXT",
  "channel::cyclePrev": "SETTINGS_KEYBOARD_CHANNEL_PREVIOUS",
  "channel::back": "SETTINGS_KEYBOARD_CHANNEL_BACK",
  "channel::forward": "SETTINGS_KEYBOARD_CHANNEL_FORWARD",
  "explore::show": "SETTINGS_KEYBOARD_EXPLORE",
  "settings::toggle": "SETTINGS_KEYBOARD_SETTINGS",
  "rail::toggle": "SETTINGS_KEYBOARD_RAIL",
  "inbox::toggle": "SETTINGS_KEYBOARD_INBOX",
  "emotePicker::toggle": "SETTINGS_KEYBOARD_EMOTE_PICKER",
  "quickSwitch::toggle": "SETTINGS_KEYBOARD_QUICK_SWITCH",
  "link::toggle": "SETTINGS_KEYBOARD_LINK_SYNC",
  "link::toggleAudioLink": "SETTINGS_KEYBOARD_LINK_AUDIO",
  "link::toggleMute": "SETTINGS_KEYBOARD_LINK_MUTE",
  "link::toggleMuteAll": "SETTINGS_KEYBOARD_LINK_MUTE_ALL",
  "link::muteOthers": "SETTINGS_KEYBOARD_LINK_MUTE_OTHERS",
  "link::closeTab": "SETTINGS_KEYBOARD_LINK_CLOSE_TAB",
  "view::toggleAlwaysOnTop": "SETTINGS_KEYBOARD_ALWAYS_ON_TOP",
  "panel::close": "SETTINGS_KEYBOARD_CLOSE_PANEL",
  "feed::toggleDensity": "SETTINGS_KEYBOARD_TOGGLE_DENSITY",
  "view::zoomIn": "SETTINGS_KEYBOARD_ZOOM_IN",
  "view::zoomOut": "SETTINGS_KEYBOARD_ZOOM_OUT",
  "view::zoomReset": "SETTINGS_KEYBOARD_ZOOM_RESET",
  "chat::send": "SETTINGS_KEYBOARD_SEND",
  "chat::tabComplete": "SETTINGS_KEYBOARD_TAB_COMPLETE",
  "chat::recallPrev": "SETTINGS_KEYBOARD_RECALL_PREVIOUS",
  "chat::recallNext": "SETTINGS_KEYBOARD_RECALL_NEXT",
};

const GROUPS: { title: MessageKey; prefix: string[] }[] = [
  {
    title: "SETTINGS_KEYBOARD_GROUP_NAVIGATION",
    prefix: ["channel::", "explore::", "settings::"],
  },
  {
    title: "SETTINGS_KEYBOARD_GROUP_PANELS",
    prefix: [
      "rail::",
      "inbox::",
      "account::",
      "emotePicker::",
      "quickSwitch::",
      "panel::",
    ],
  },
  { title: "SETTINGS_KEYBOARD_GROUP_LINK", prefix: ["link::"] },
  { title: "SETTINGS_KEYBOARD_GROUP_VIEW", prefix: ["view::"] },
  { title: "SETTINGS_KEYBOARD_GROUP_CHAT", prefix: ["feed::", "chat::"] },
];

type Row = { combo: string; label: string };

function actionLabel(action: string): string {
  const slot = /^channel::select(\d)$/.exec(action)?.[1];
  if (slot) return t("SETTINGS_KEYBOARD_CHANNEL_SELECT", { slot });
  const key = ACTION_LABELS[action];
  return key ? t(key) : action;
}

function rowsFor(prefixes: string[]): Row[] {
  return Object.entries(defaultKeymap as Record<string, string[]>)
    .flatMap(([combo, actions]) => {
      const action = actions.find((a) => prefixes.some((p) => a.startsWith(p)));
      return action ? [{ combo, label: actionLabel(action) }] : [];
    });
}

export default function KeyboardSection() {
  return (
    <PageBody
      title={t("SETTINGS_KEYBOARD")}
      lede={t("SETTINGS_KEYBOARD_LEDE")}
    >
      <For each={GROUPS}>
        {(g) => (
          <Card>
            <div class="px-5 pt-4 pb-2 text-small text-ink-faint">
              {t(g.title)}
            </div>
            <For each={rowsFor(g.prefix)}>
              {(row) => (
                <div class="flex items-center justify-between gap-6 px-5 h-11 border-t border-line-soft">
                  <span class="text-body text-ink">{row.label}</span>
                  <Kbd combo={row.combo} />
                </div>
              )}
            </For>
          </Card>
        )}
      </For>
    </PageBody>
  );
}
