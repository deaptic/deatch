import { t } from "../../shared/i18n/index.ts";
import Card from "../../kit/Card.tsx";
import CardLabel from "../../kit/CardLabel.tsx";
import ColorPicker from "../../kit/ColorPicker.tsx";
import SettingsRow from "../../kit/SettingsRow.tsx";
import StepSlider from "../../kit/StepSlider.tsx";
import Toggle from "../../kit/Toggle.tsx";
import { FONT_SIZE_STEPS } from "../../shared/accessibility.ts";
import {
  feedFontSize,
  feedUserOverrideNameColor,
  feedUserShowDisplayName,
  setFeedFontSize,
  setFeedUserOverrideNameColor,
  setFeedUserShowDisplayName,
} from "../preferences/index.ts";

import { formatPx } from "../../shared/format/units.ts";
import { DEFAULT_ACCENT_HEX } from "../../shared/theme.ts";
export default function ReadabilityCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_MESSAGES_TEXT_TITLE")}</CardLabel>
      <SettingsRow label={t("SETTINGS_MESSAGES_FONT_SIZE_LABEL")} stacked>
        <StepSlider
          label={t("SETTINGS_MESSAGES_FONT_SIZE_LABEL")}
          value={feedFontSize()}
          steps={FONT_SIZE_STEPS}
          format={formatPx}
          onChange={setFeedFontSize}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_MESSAGES_DISPLAY_NAMES_LABEL")}
        description={t("SETTINGS_MESSAGES_DISPLAY_NAMES_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_MESSAGES_DISPLAY_NAMES_LABEL")}
          checked={feedUserShowDisplayName()}
          onChange={setFeedUserShowDisplayName}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_MESSAGES_NAME_COLOR_LABEL")}
        description={t("SETTINGS_MESSAGES_NAME_COLOR_DESCRIPTION")}
      >
        <ColorPicker
          swatchColor={feedUserOverrideNameColor() || "transparent"}
          value={feedUserOverrideNameColor() || DEFAULT_ACCENT_HEX}
          onInput={setFeedUserOverrideNameColor}
          onReset={() => setFeedUserOverrideNameColor("")}
          resetDisabled={!feedUserOverrideNameColor()}
        />
      </SettingsRow>
    </Card>
  );
}
