import { t } from "../../../lib/i18n/index.ts";
import Card from "../../ui/Card.tsx";
import CardLabel from "../../ui/CardLabel.tsx";
import ColorPicker from "../../ui/ColorPicker.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import StopSlider from "../../ui/StopSlider.tsx";
import Toggle from "../../ui/Toggle.tsx";
import * as appearance from "../../../lib/services/appearance.ts";
import { FONT_SIZE_STOPS } from "../../../lib/constants/accessibility.ts";
import {
  feedFontSize,
  feedUserOverrideNameColor,
  feedUserShowDisplayName,
  setFeedFontSize,
  setFeedUserOverrideNameColor,
  setFeedUserShowDisplayName,
} from "../../../lib/stores/preferences.ts";

import { formatPx } from "../../../lib/format/units.ts";
export default function ReadabilityCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_APPEARANCE_TEXT")}</CardLabel>
      <SettingsRow label={t("SETTINGS_APPEARANCE_FONT_SIZE")} stacked>
        <StopSlider
          label={t("SETTINGS_APPEARANCE_FONT_SIZE")}
          value={feedFontSize()}
          stops={FONT_SIZE_STOPS}
          format={formatPx}
          onChange={setFeedFontSize}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_DISPLAY_NAMES")}
        description={t("SETTINGS_APPEARANCE_DISPLAY_NAMES_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_APPEARANCE_DISPLAY_NAMES")}
          checked={feedUserShowDisplayName()}
          onChange={setFeedUserShowDisplayName}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_NAME_COLOR")}
        description={t("SETTINGS_APPEARANCE_NAME_COLOR_DESCRIPTION")}
      >
        <ColorPicker
          swatchColor={feedUserOverrideNameColor() || "transparent"}
          value={feedUserOverrideNameColor() || appearance.defaultAccentHex}
          onInput={setFeedUserOverrideNameColor}
          onReset={() => setFeedUserOverrideNameColor("")}
          resetDisabled={!feedUserOverrideNameColor()}
        />
      </SettingsRow>
    </Card>
  );
}
