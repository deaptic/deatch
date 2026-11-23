import { t } from "../../shared/i18n/index.ts";
import { For } from "solid-js";
import Card from "../../kit/Card.tsx";
import CardLabel from "../../kit/CardLabel.tsx";
import SettingsRow from "../../kit/SettingsRow.tsx";
import Toggle from "../../kit/Toggle.tsx";
import { EVENTS } from "../../shared/moderateActions.ts";
import {
  feedEvents,
  feedShowEvents,
  setFeedEvent,
  setFeedShowEvents,
} from "../preferences/index.ts";

export default function ShownInChatCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_APPEARANCE_SHOWN_IN_CHAT_TITLE")}</CardLabel>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_EVENTS_SHOW_LABEL")}
        description={t("SETTINGS_APPEARANCE_EVENTS_SHOW_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_APPEARANCE_EVENTS_SHOW_LABEL")}
          checked={feedShowEvents()}
          onChange={setFeedShowEvents}
        />
      </SettingsRow>
      <For each={EVENTS}>
        {(e) => (
          <SettingsRow label={t(e.label)} description={t(e.description)}>
            <Toggle
              label={t(e.label)}
              checked={feedEvents()[e.key].show !== false}
              disabled={e.key !== "message" && !feedShowEvents()}
              onChange={(v) => setFeedEvent(e.key, v)}
            />
          </SettingsRow>
        )}
      </For>
    </Card>
  );
}
