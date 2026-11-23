import { t } from "../../../lib/i18n/index.ts";
import Card from "../../ui/Card.tsx";
import CardLabel from "../../ui/CardLabel.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Toggle from "../../ui/Toggle.tsx";
import {
  feedDensity,
  feedShowAvatars,
  feedShowCopypasta,
  feedShowDeletedContent,
  feedShowTimestamp,
  setFeedShowAvatars,
  setFeedShowCopypasta,
  setFeedShowDeletedContent,
  setFeedShowTimestamp,
} from "../../../lib/stores/preferences.ts";

export default function MessagesCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_APPEARANCE_MESSAGES_TITLE")}</CardLabel>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_TIMESTAMPS_LABEL")}
        description={t("SETTINGS_APPEARANCE_TIMESTAMPS_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_APPEARANCE_TIMESTAMPS_LABEL")}
          disabled={feedDensity() === "comfortable"}
          checked={feedShowTimestamp()}
          onChange={setFeedShowTimestamp}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_AVATARS_LABEL")}
        description={t("SETTINGS_APPEARANCE_AVATARS_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_APPEARANCE_AVATARS_LABEL")}
          disabled={feedDensity() !== "comfortable"}
          checked={feedShowAvatars()}
          onChange={setFeedShowAvatars}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_DELETED_LABEL")}
        description={t("SETTINGS_APPEARANCE_DELETED_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_APPEARANCE_DELETED_LABEL")}
          checked={feedShowDeletedContent()}
          onChange={setFeedShowDeletedContent}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_COPYPASTA_LABEL")}
        description={t("SETTINGS_APPEARANCE_COPYPASTA_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_APPEARANCE_COPYPASTA_LABEL")}
          checked={feedShowCopypasta()}
          onChange={setFeedShowCopypasta}
        />
      </SettingsRow>
    </Card>
  );
}
