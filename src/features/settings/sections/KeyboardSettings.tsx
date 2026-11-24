import { type MessageKey, t } from "../../../shared/i18n/index.ts";
import { For, Show, useContext } from "solid-js";
import PageBody from "../../../kit/PageBody.tsx";
import Card from "../../../kit/Card.tsx";
import CardLabel from "../../../kit/CardLabel.tsx";
import Kbd from "../../../kit/Kbd.tsx";
import { SettingsQuery } from "../../../kit/settingsQuery.ts";
import { matchesQuery } from "../../../shared/textQuery.ts";
import defaultKeymap from "../../../default-keymap.json" with { type: "json" };
import { ACTION_LABELS, CHANNEL_SELECT } from "../keyboard.ts";

const GROUPS: { title: MessageKey; prefix: string[] }[] = [
  {
    title: "SETTINGS_KEYBOARD_GROUP_NAVIGATION_TITLE",
    prefix: ["channel::", "explore::", "settings::"],
  },
  {
    title: "SETTINGS_KEYBOARD_GROUP_PANELS_TITLE",
    prefix: ["rail::", "inbox::", "emotePicker::", "quickSwitch::", "panel::"],
  },
  { title: "SETTINGS_KEYBOARD_GROUP_LINK_TITLE", prefix: ["link::"] },
  { title: "SETTINGS_KEYBOARD_GROUP_VIEW_TITLE", prefix: ["view::"] },
  { title: "SETTINGS_KEYBOARD_GROUP_CHAT_TITLE", prefix: ["feed::", "chat::"] },
];

type Row = { combo: string; label: string };

function actionLabel(action: string): string {
  const slot = CHANNEL_SELECT.exec(action)?.[1];
  if (slot) return t("SETTINGS_KEYBOARD_CHANNEL_SELECT_LABEL", { slot });
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

export default function KeyboardSettings() {
  const query = useContext(SettingsQuery);

  return (
    <PageBody title={t("SETTINGS_KEYBOARD_TITLE")}>
      <For each={GROUPS}>
        {(g) => (
          <Card>
            <CardLabel>{t(g.title)}</CardLabel>
            <For each={rowsFor(g.prefix)}>
              {(row) => (
                <Show when={matchesQuery(query(), row.label, row.combo)}>
                  <div
                    data-match
                    class="flex items-center justify-between gap-6 px-4 h-10"
                  >
                    <span class="text-body text-ink">{row.label}</span>
                    <Kbd combo={row.combo} />
                  </div>
                </Show>
              )}
            </For>
          </Card>
        )}
      </For>
    </PageBody>
  );
}
