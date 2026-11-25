import { t } from "../../shared/i18n/index.ts";
import Card from "../../kit/Card.tsx";
import CardLabel from "../../kit/CardLabel.tsx";
import Segmented from "../../kit/Segmented.tsx";
import FormRow from "../../kit/FormRow.tsx";
import StepSlider from "../../kit/StepSlider.tsx";
import Toggle from "../../kit/Toggle.tsx";
import { GROUP_SPACING_STEPS } from "../../shared/accessibility.ts";
import { formatPx } from "../../shared/format/units.ts";
import { messageLayoutOptions } from "./options.ts";
import {
  feedDensity,
  feedGroupMessages,
  feedGroupSpacing,
  feedShowAvatars,
  setFeedDensity,
  setFeedGroupMessages,
  setFeedGroupSpacing,
} from "../preferences/index.ts";

export default function LayoutCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_MESSAGES_LAYOUT_TITLE")}</CardLabel>
      <FormRow
        label={t("SETTINGS_MESSAGES_LAYOUT_LABEL")}
        description={t("SETTINGS_MESSAGES_LAYOUT_DESCRIPTION")}
      >
        <Segmented
          label={t("SETTINGS_MESSAGES_LAYOUT_LABEL")}
          value={feedDensity()}
          options={messageLayoutOptions()}
          onChange={setFeedDensity}
        />
      </FormRow>
      <FormRow
        label={t("SETTINGS_MESSAGES_GROUPING_LABEL")}
        description={t("SETTINGS_MESSAGES_GROUPING_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_MESSAGES_GROUPING_LABEL")}
          checked={feedGroupMessages()}
          onChange={setFeedGroupMessages}
          disabled={feedDensity() !== "comfortable" || !feedShowAvatars()}
        />
      </FormRow>
      <FormRow
        label={t("SETTINGS_MESSAGES_GROUP_SPACING_LABEL")}
        description={t("SETTINGS_MESSAGES_GROUP_SPACING_DESCRIPTION")}
        layout="stacked"
      >
        <StepSlider
          label={t("SETTINGS_MESSAGES_GROUP_SPACING_LABEL")}
          disabled={feedDensity() !== "comfortable"}
          value={feedGroupSpacing()}
          steps={GROUP_SPACING_STEPS}
          format={formatPx}
          onChange={setFeedGroupSpacing}
        />
      </FormRow>
    </Card>
  );
}
