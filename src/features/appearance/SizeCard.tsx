import { t } from "../../shared/i18n/index.ts";
import Card from "../../kit/Card.tsx";
import CardLabel from "../../kit/CardLabel.tsx";
import Segmented from "../../kit/Segmented.tsx";
import SettingsRow from "../../kit/SettingsRow.tsx";
import StepSlider from "../../kit/StepSlider.tsx";
import { ZOOM_STEPS } from "../../shared/accessibility.ts";
import { formatWholePercent } from "../../shared/format/units.ts";
import { uiDensityOptions } from "./options.ts";
import {
  appearanceUiDensity,
  appearanceZoom,
  setAppearanceUiDensity,
  setAppearanceZoom,
} from "../preferences/index.ts";

export default function SizeCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_APPEARANCE_SIZE_TITLE")}</CardLabel>
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
        label={t("SETTINGS_APPEARANCE_ZOOM_LABEL")}
        description={t("SETTINGS_APPEARANCE_ZOOM_DESCRIPTION")}
        stacked
      >
        <StepSlider
          label={t("SETTINGS_APPEARANCE_ZOOM_LABEL")}
          value={appearanceZoom()}
          steps={ZOOM_STEPS}
          format={formatWholePercent}
          onChange={setAppearanceZoom}
        />
      </SettingsRow>
    </Card>
  );
}
