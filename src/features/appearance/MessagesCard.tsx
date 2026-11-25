import { t } from "../../shared/i18n/index.ts";
import Card from "../../kit/Card.tsx";
import CardLabel from "../../kit/CardLabel.tsx";
import FormRow from "../../kit/FormRow.tsx";
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
      <FormRow
        label={t("SETTINGS_MESSAGES_TIMESTAMPS_LABEL")}
        description={t("SETTINGS_MESSAGES_TIMESTAMPS_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_MESSAGES_TIMESTAMPS_LABEL")}
          checked={feedShowTimestamp()}
          onChange={setFeedShowTimestamp}
        />
      </FormRow>
      <FormRow
        label={t("SETTINGS_MESSAGES_AVATARS_LABEL")}
        description={t("SETTINGS_MESSAGES_AVATARS_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_MESSAGES_AVATARS_LABEL")}
          disabled={feedDensity() !== "comfortable"}
          checked={feedShowAvatars()}
          onChange={setFeedShowAvatars}
        />
      </FormRow>
      <FormRow
        label={t("SETTINGS_MESSAGES_DELETED_LABEL")}
        description={t("SETTINGS_MESSAGES_DELETED_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_MESSAGES_DELETED_LABEL")}
          checked={feedShowDeletedContent()}
          onChange={setFeedShowDeletedContent}
        />
      </FormRow>
      <FormRow
        label={t("SETTINGS_MESSAGES_COPYPASTA_LABEL")}
        description={t("SETTINGS_MESSAGES_COPYPASTA_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_MESSAGES_COPYPASTA_LABEL")}
          checked={feedShowCopypasta()}
          onChange={setFeedShowCopypasta}
        />
      </FormRow>
    </Card>
  );
}
