import { t } from "../../../lib/i18n/index.ts";
import { For } from "solid-js";
import Card from "../../ui/Card.tsx";
import CardLabel from "../../ui/CardLabel.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Toggle from "../../ui/Toggle.tsx";
import { EVENTS } from "../../../lib/constants.ts";
import { feedEvents, setFeedEvent } from "../../../lib/stores/preferences.ts";

export default function ShownInChatCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_APPEARANCE_SHOWN_IN_CHAT")}</CardLabel>
      <For each={EVENTS}>
        {(e) => (
          <SettingsRow label={t(e.label)} description={t(e.description)}>
            <Toggle
              label={t(e.label)}
              checked={feedEvents()[e.key]?.show !== false}
              onChange={(v) => setFeedEvent(e.key, v)}
            />
          </SettingsRow>
        )}
      </For>
    </Card>
  );
}
