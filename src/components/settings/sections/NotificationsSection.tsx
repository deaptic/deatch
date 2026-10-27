import { t } from "../../../lib/i18n/index.ts";
import { For, Show } from "solid-js";
import PageBody from "../../ui/PageBody.tsx";
import Card from "../../ui/Card.tsx";
import Chip from "../../ui/Chip.tsx";
import ChipInput from "../../ui/ChipInput.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Toggle from "../../ui/Toggle.tsx";
import {
  addFeedKeyword,
  feedKeywords,
  notificationsMentionSound,
  removeFeedKeyword,
  setNotificationsMentionSound,
} from "../../../lib/stores/preferences.ts";

export default function NotificationsSection() {
  return (
    <PageBody
      title={t("SETTINGS_NOTIFICATIONS")}
      lede={t("SETTINGS_NOTIFICATIONS_LEDE")}
    >
      <Card>
        <SettingsRow
          label={t("SETTINGS_NOTIFICATIONS_KEYWORDS")}
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
          label={t("SETTINGS_NOTIFICATIONS_MENTION_SOUND")}
          description={t("SETTINGS_NOTIFICATIONS_MENTION_SOUND_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_NOTIFICATIONS_MENTION_SOUND")}
            checked={notificationsMentionSound()}
            onChange={setNotificationsMentionSound}
          />
        </SettingsRow>
      </Card>
    </PageBody>
  );
}
