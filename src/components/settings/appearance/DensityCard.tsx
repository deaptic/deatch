import { t } from "../../../lib/i18n/index.ts";
import Card from "../../ui/Card.tsx";
import CardLabel from "../../ui/CardLabel.tsx";
import Segmented from "../../ui/Segmented.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import StopSlider from "../../ui/StopSlider.tsx";
import Toggle from "../../ui/Toggle.tsx";
import {
  GROUP_SPACING_STOPS,
  ZOOM_STOPS,
} from "../../../lib/constants/accessibility.ts";
import { messageLayoutOptions, uiDensityOptions } from "./options.ts";
import {
  appearanceUiDensity,
  appearanceZoom,
  feedDensity,
  feedGroupMessages,
  feedShowAvatars,
  feedGroupSpacing,
  setAppearanceUiDensity,
  setAppearanceZoom,
  setFeedDensity,
  setFeedGroupMessages,
  setFeedGroupSpacing,
} from "../../../lib/stores/preferences.ts";

import { formatPx, formatWholePercent } from "../../../lib/format/units.ts";
export default function DensityCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_APPEARANCE_LAYOUT_TITLE")}</CardLabel>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_DENSITY_LABEL")}
        description={t("SETTINGS_APPEARANCE_DENSITY_DESCRIPTION")}
      >
        <Segmented
          label={t("SETTINGS_APPEARANCE_DENSITY_LABEL")}
          value={appearanceUiDensity()}
          options={uiDensityOptions()}
          onChange={setAppearanceUiDensity}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_MESSAGE_LAYOUT_LABEL")}
        description={t("SETTINGS_APPEARANCE_MESSAGE_LAYOUT_DESCRIPTION")}
      >
        <Segmented
          label={t("SETTINGS_APPEARANCE_MESSAGE_LAYOUT_LABEL")}
          value={feedDensity()}
          options={messageLayoutOptions()}
          onChange={setFeedDensity}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_GROUPING_LABEL")}
        description={t("SETTINGS_APPEARANCE_GROUPING_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_APPEARANCE_GROUPING_LABEL")}
          checked={feedGroupMessages()}
          onChange={setFeedGroupMessages}
          disabled={feedDensity() !== "comfortable" || !feedShowAvatars()}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_GROUP_SPACING_LABEL")}
        description={t("SETTINGS_APPEARANCE_GROUP_SPACING_DESCRIPTION")}
        stacked
      >
        <StopSlider
          label={t("SETTINGS_APPEARANCE_GROUP_SPACING_LABEL")}
          disabled={feedDensity() !== "comfortable"}
          value={feedGroupSpacing()}
          stops={GROUP_SPACING_STOPS}
          format={formatPx}
          onChange={setFeedGroupSpacing}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_ZOOM_LABEL")}
        description={t("SETTINGS_APPEARANCE_ZOOM_DESCRIPTION")}
        stacked
      >
        <StopSlider
          label={t("SETTINGS_APPEARANCE_ZOOM_LABEL")}
          value={appearanceZoom()}
          stops={ZOOM_STOPS}
          format={formatWholePercent}
          onChange={setAppearanceZoom}
        />
      </SettingsRow>
    </Card>
  );
}
