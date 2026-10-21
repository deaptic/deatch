import { t } from "../../../lib/i18n/index.ts";
import PageBody from "../../ui/PageBody.tsx";
import Card from "../../ui/Card.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Toggle from "../../ui/Toggle.tsx";
import {
  moderationActionsDisabled,
  moderationAutoShoutoutOnRaid,
  setModerationActionsDisabled,
  setModerationAutoShoutoutOnRaid,
} from "../../../lib/stores/preferences.ts";

export default function ModerationSection() {
  return (
    <PageBody
      title={t("SETTINGS_MODERATION")}
      lede={t("SETTINGS_MODERATION_LEDE")}
    >
      <Card>
        <SettingsRow
          label={t("SETTINGS_MODERATION_SHOUTOUT_RAIDERS")}
          description={t("SETTINGS_MODERATION_SHOUTOUT_RAIDERS_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_MODERATION_SHOUTOUT_RAIDERS")}
            checked={moderationAutoShoutoutOnRaid()}
            onChange={setModerationAutoShoutoutOnRaid}
          />
        </SettingsRow>
        <SettingsRow
          label={t("SETTINGS_MODERATION_HIDE_ACTIONS")}
          description={t("SETTINGS_MODERATION_HIDE_ACTIONS_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_MODERATION_HIDE_ACTIONS")}
            checked={moderationActionsDisabled()}
            onChange={setModerationActionsDisabled}
          />
        </SettingsRow>
      </Card>
    </PageBody>
  );
}
