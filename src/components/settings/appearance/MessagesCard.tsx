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
      <CardLabel>{t("SETTINGS_APPEARANCE_MESSAGES")}</CardLabel>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_TIMESTAMPS")}
        description={t("SETTINGS_APPEARANCE_TIMESTAMPS_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_APPEARANCE_TIMESTAMPS")}
          disabled={feedDensity() === "comfortable"}
          checked={feedShowTimestamp()}
          onChange={setFeedShowTimestamp}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_AVATARS")}
        description={t("SETTINGS_APPEARANCE_AVATARS_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_APPEARANCE_AVATARS")}
          disabled={feedDensity() !== "comfortable"}
          checked={feedShowAvatars()}
          onChange={setFeedShowAvatars}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_DELETED")}
        description={t("SETTINGS_APPEARANCE_DELETED_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_APPEARANCE_DELETED")}
          checked={feedShowDeletedContent()}
          onChange={setFeedShowDeletedContent}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_COPYPASTA")}
        description={t("SETTINGS_APPEARANCE_COPYPASTA_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_APPEARANCE_COPYPASTA")}
          checked={feedShowCopypasta()}
          onChange={setFeedShowCopypasta}
        />
      </SettingsRow>
    </Card>
  );
}
