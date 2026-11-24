import { t } from "../../../shared/i18n/index.ts";
import { For, Show } from "solid-js";
import PageBody from "../../../kit/PageBody.tsx";
import Card from "../../../kit/Card.tsx";
import CardLabel from "../../../kit/CardLabel.tsx";
import { ALERT_GROUPS } from "./alertGroups.ts";
import Chip from "../../../kit/Chip.tsx";
import ChipInput from "../../../kit/ChipInput.tsx";
import SettingsRow from "../../../kit/SettingsRow.tsx";
import Toggle from "../../../kit/Toggle.tsx";
import {
  addFeedKeyword,
  feedKeywords,
  alertOn,
  notificationsMentionSound,
  notificationsWhisperSound,
  removeFeedKeyword,
  setAlertOn,
  setNotificationsMentionSound,
  setNotificationsWhisperSound,
} from "../../preferences/index.ts";

export default function NotificationsSettings() {
  return (
    <PageBody title={t("SETTINGS_NOTIFICATIONS_TITLE")}>
      <Card>
        <CardLabel>{t("SETTINGS_NOTIFICATIONS_MESSAGES_TITLE")}</CardLabel>
        <SettingsRow
          label={t("SETTINGS_NOTIFICATIONS_HIGHLIGHT_WORDS_LABEL")}
          description={t("SETTINGS_NOTIFICATIONS_HIGHLIGHT_WORDS_DESCRIPTION")}
          stacked
        >
          <ChipInput
            placeholder={t(
              "SETTINGS_NOTIFICATIONS_HIGHLIGHT_WORDS_PLACEHOLDER",
            )}
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
          label={t("SETTINGS_NOTIFICATIONS_MENTIONS_LABEL")}
          description={t("SETTINGS_NOTIFICATIONS_MENTIONS_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_NOTIFICATIONS_MENTIONS_LABEL")}
            checked={notificationsMentionSound()}
            onChange={setNotificationsMentionSound}
          />
        </SettingsRow>
        <SettingsRow
          label={t("SETTINGS_NOTIFICATIONS_WHISPERS_LABEL")}
          description={t("SETTINGS_NOTIFICATIONS_WHISPERS_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_NOTIFICATIONS_WHISPERS_LABEL")}
            checked={notificationsWhisperSound()}
            onChange={setNotificationsWhisperSound}
          />
        </SettingsRow>
      </Card>
      <For each={ALERT_GROUPS}>
        {(group) => (
          <Card>
            <CardLabel>{t(group.title)}</CardLabel>
            <For each={group.rows}>
              {(row) => (
                <SettingsRow
                  label={t(row.label)}
                  description={t(row.description)}
                >
                  <Toggle
                    label={t(row.label)}
                    checked={alertOn(row.alert)}
                    onChange={(on) => setAlertOn(row.alert, on)}
                  />
                </SettingsRow>
              )}
            </For>
          </Card>
        )}
      </For>
    </PageBody>
  );
}
