import { t } from "../../shared/i18n/index.ts";
import Card from "../../kit/Card.tsx";
import CardLabel from "../../kit/CardLabel.tsx";
import SettingsRow from "../../kit/SettingsRow.tsx";
import Toggle from "../../kit/Toggle.tsx";
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
} from "../preferences/index.ts";

export default function MessagesCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_MESSAGES_DETAILS_TITLE")}</CardLabel>
      <SettingsRow
        label={t("SETTINGS_MESSAGES_TIMESTAMPS_LABEL")}
        description={t("SETTINGS_MESSAGES_TIMESTAMPS_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_MESSAGES_TIMESTAMPS_LABEL")}
          checked={feedShowTimestamp()}
          onChange={setFeedShowTimestamp}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_MESSAGES_AVATARS_LABEL")}
        description={t("SETTINGS_MESSAGES_AVATARS_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_MESSAGES_AVATARS_LABEL")}
          disabled={feedDensity() !== "comfortable"}
          checked={feedShowAvatars()}
          onChange={setFeedShowAvatars}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_MESSAGES_DELETED_LABEL")}
        description={t("SETTINGS_MESSAGES_DELETED_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_MESSAGES_DELETED_LABEL")}
          checked={feedShowDeletedContent()}
          onChange={setFeedShowDeletedContent}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_MESSAGES_COPYPASTA_LABEL")}
        description={t("SETTINGS_MESSAGES_COPYPASTA_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_MESSAGES_COPYPASTA_LABEL")}
          checked={feedShowCopypasta()}
          onChange={setFeedShowCopypasta}
        />
      </SettingsRow>
    </Card>
  );
}
