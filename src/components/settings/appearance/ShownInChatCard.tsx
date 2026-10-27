import { t } from "../../../lib/i18n/index.ts";
import { For } from "solid-js";
import Card from "../../ui/Card.tsx";
import CardLabel from "../../ui/CardLabel.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Toggle from "../../ui/Toggle.tsx";
import { EVENTS } from "../../../lib/constants.ts";
import {
  feedEvents,
  feedShowEvents,
  setFeedEvent,
  setFeedShowEvents,
} from "../../../lib/stores/preferences.ts";

export default function ShownInChatCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_APPEARANCE_SHOWN_IN_CHAT")}</CardLabel>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_EVENTS_SHOW")}
        description={t("SETTINGS_APPEARANCE_EVENTS_SHOW_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_APPEARANCE_EVENTS_SHOW")}
          checked={feedShowEvents()}
          onChange={setFeedShowEvents}
        />
      </SettingsRow>
      <For each={EVENTS}>
        {(e) => (
          <SettingsRow label={t(e.label)} description={t(e.description)}>
            <Toggle
              label={t(e.label)}
              checked={feedEvents()[e.key]?.show !== false}
              disabled={e.key !== "message" && !feedShowEvents()}
              onChange={(v) => setFeedEvent(e.key, v)}
            />
          </SettingsRow>
        )}
      </For>
    </Card>
  );
}
