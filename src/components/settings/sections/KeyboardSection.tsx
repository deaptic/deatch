import { type MessageKey, t } from "../../../lib/i18n/index.ts";
import { For } from "solid-js";
import PageBody from "../../ui/PageBody.tsx";
import Card from "../../ui/Card.tsx";
import Kbd from "../../ui/Kbd.tsx";
import defaultKeymap from "../../../default-keymap.json" with { type: "json" };
import {
  ACTION_LABELS,
  CHANNEL_SELECT,
} from "../../../lib/constants/keyboard.ts";

const GROUPS: { title: MessageKey; prefix: string[] }[] = [
  {
    title: "SETTINGS_KEYBOARD_GROUP_NAVIGATION",
    prefix: ["channel::", "explore::", "settings::"],
  },
  {
    title: "SETTINGS_KEYBOARD_GROUP_PANELS",
    prefix: ["rail::", "inbox::", "emotePicker::", "quickSwitch::", "panel::"],
  },
  { title: "SETTINGS_KEYBOARD_GROUP_LINK", prefix: ["link::"] },
  { title: "SETTINGS_KEYBOARD_GROUP_VIEW", prefix: ["view::"] },
  { title: "SETTINGS_KEYBOARD_GROUP_CHAT", prefix: ["feed::", "chat::"] },
];

type Row = { combo: string; label: string };

function actionLabel(action: string): string {
  const slot = CHANNEL_SELECT.exec(action)?.[1];
  if (slot) return t("SETTINGS_KEYBOARD_CHANNEL_SELECT", { slot });
  const key = ACTION_LABELS[action];
  return key ? t(key) : action;
}

function rowsFor(prefixes: string[]): Row[] {
  return Object.entries(defaultKeymap as Record<string, string[]>).flatMap(
    ([combo, actions]) => {
      const action = actions.find((a) => prefixes.some((p) => a.startsWith(p)));
      return action ? [{ combo, label: actionLabel(action) }] : [];
    },
  );
}

export default function KeyboardSection() {
  return (
    <PageBody title={t("SETTINGS_KEYBOARD")} lede={t("SETTINGS_KEYBOARD_LEDE")}>
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
