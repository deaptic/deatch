import { t } from "../../../shared/i18n/index.ts";
import { For, Show } from "solid-js";
import PageBody from "../../../kit/PageBody.tsx";
import Card from "../../../kit/Card.tsx";
import Chip from "../../../kit/Chip.tsx";
import ChipInput from "../../../kit/ChipInput.tsx";
import SettingsRow from "../../../kit/SettingsRow.tsx";
import Toggle from "../../../kit/Toggle.tsx";
import {
  addFeedKeyword,
  feedKeywords,
  notificationsMentionSound,
  removeFeedKeyword,
  setNotificationsMentionSound,
} from "../../../lib/stores/preferences.ts";

export default function NotificationsSettings() {
  return (
    <PageBody title={t("SETTINGS_NOTIFICATIONS_TITLE")}>
      <Card>
        <SettingsRow
          label={t("SETTINGS_NOTIFICATIONS_KEYWORDS_LABEL")}
          description={t("SETTINGS_NOTIFICATIONS_KEYWORDS_DESCRIPTION")}
          stacked
        >
          <ChipInput
            placeholder={t("SETTINGS_NOTIFICATIONS_KEYWORDS_PLACEHOLDER")}
            onAdd={addFeedKeyword}
          />
          <Show when={feedKeywords().length > 0}>
            <div class="flex flex-wrap gap-1.5">
              <For each={feedKeywords()}>
                {(kw) => (
                  <Chip label={kw} onRemove={() => removeFeedKeyword(kw)} />
                )}
              </For>
            </div>
          </Show>
        </SettingsRow>
        <SettingsRow
          label={t("SETTINGS_NOTIFICATIONS_MENTION_SOUND_LABEL")}
          description={t("SETTINGS_NOTIFICATIONS_MENTION_SOUND_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_NOTIFICATIONS_MENTION_SOUND_LABEL")}
            checked={notificationsMentionSound()}
            onChange={setNotificationsMentionSound}
          />
        </SettingsRow>
      </Card>
    </PageBody>
  );
}
