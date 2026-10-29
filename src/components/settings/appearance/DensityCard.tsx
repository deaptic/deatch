import { t } from "../../../lib/i18n/index.ts";
import Card from "../../ui/Card.tsx";
import CardLabel from "../../ui/CardLabel.tsx";
import Segmented from "../../ui/Segmented.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import StopSlider from "../../ui/StopSlider.tsx";
import {
  GROUP_SPACING_STOPS,
  type UiDensity,
  ZOOM_STOPS,
} from "../../../lib/constants/accessibility.ts";
import type { Density } from "../../../lib/constants/density.ts";
import {
  appearanceUiDensity,
  appearanceZoom,
  feedDensity,
  feedGroupSpacing,
  setAppearanceUiDensity,
  setAppearanceZoom,
  setFeedDensity,
  setFeedGroupSpacing,
} from "../../../lib/stores/preferences.ts";

import { formatPx, formatWholePercent } from "../../../lib/format/units.ts";
export default function DensityCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_APPEARANCE_LAYOUT")}</CardLabel>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_CHANNEL_SPACING")}
        description={t("SETTINGS_APPEARANCE_CHANNEL_SPACING_DESCRIPTION")}
      >
        <Segmented
          label={t("SETTINGS_APPEARANCE_CHANNEL_SPACING")}
          value={appearanceUiDensity()}
          options={
            [
              { value: "compact", label: t("SETTINGS_APPEARANCE_COMPACT") },
              { value: "default", label: t("SETTINGS_APPEARANCE_DEFAULT") },
              { value: "spacious", label: t("SETTINGS_APPEARANCE_SPACIOUS") },
            ] satisfies { value: UiDensity; label: string }[]
          }
          onChange={setAppearanceUiDensity}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_MESSAGE_LAYOUT")}
        description={t("SETTINGS_APPEARANCE_MESSAGE_LAYOUT_DESCRIPTION")}
      >
        <Segmented
          label={t("SETTINGS_APPEARANCE_MESSAGE_LAYOUT")}
          value={feedDensity()}
          options={
            [
              { value: "compact", label: t("SETTINGS_APPEARANCE_DEFAULT") },
              {
                value: "comfortable",
                label: t("SETTINGS_APPEARANCE_SPACIOUS"),
              },
            ] satisfies { value: Density; label: string }[]
          }
          onChange={setFeedDensity}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_GROUP_SPACING")}
        description={t("SETTINGS_APPEARANCE_GROUP_SPACING_DESCRIPTION")}
        stacked
      >
        <StopSlider
          label={t("SETTINGS_APPEARANCE_GROUP_SPACING")}
          disabled={feedDensity() !== "comfortable"}
          value={feedGroupSpacing()}
          stops={GROUP_SPACING_STOPS}
          format={formatPx}
          onChange={setFeedGroupSpacing}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_ZOOM")}
        description={t("SETTINGS_APPEARANCE_ZOOM_DESCRIPTION")}
        stacked
      >
        <StopSlider
          label={t("SETTINGS_APPEARANCE_ZOOM")}
          value={appearanceZoom()}
          stops={ZOOM_STOPS}
          format={formatWholePercent}
          onChange={setAppearanceZoom}
        />
      </SettingsRow>
    </Card>
  );
}
