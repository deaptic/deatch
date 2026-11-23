import { t } from "../../../shared/i18n/index.ts";
import PageBody from "../../../kit/PageBody.tsx";
import Card from "../../../kit/Card.tsx";
import SettingsRow from "../../../kit/SettingsRow.tsx";
import Toggle from "../../../kit/Toggle.tsx";
import {
  moderationActionsDisabled,
  moderationAutoShoutoutOnRaid,
  setModerationActionsDisabled,
  setModerationAutoShoutoutOnRaid,
} from "../../../lib/stores/preferences.ts";

export default function ModerationSection() {
  return (
    <PageBody title={t("SETTINGS_MODERATION_TITLE")}>
      <Card>
        <SettingsRow
          label={t("SETTINGS_MODERATION_SHOUTOUT_RAIDERS_LABEL")}
          description={t("SETTINGS_MODERATION_SHOUTOUT_RAIDERS_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_MODERATION_SHOUTOUT_RAIDERS_LABEL")}
            checked={moderationAutoShoutoutOnRaid()}
            onChange={setModerationAutoShoutoutOnRaid}
          />
        </SettingsRow>
        <SettingsRow
          label={t("SETTINGS_MODERATION_HIDE_ACTIONS_LABEL")}
          description={t("SETTINGS_MODERATION_HIDE_ACTIONS_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_MODERATION_HIDE_ACTIONS_LABEL")}
            checked={moderationActionsDisabled()}
            onChange={setModerationActionsDisabled}
          />
        </SettingsRow>
      </Card>
    </PageBody>
  );
}
