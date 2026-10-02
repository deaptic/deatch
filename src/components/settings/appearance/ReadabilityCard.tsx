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

const px = (value: number) => `${value}px`;

export default function ReadabilityCard() {
  return (
    <Card>
      <CardLabel>Text readability</CardLabel>
      <SettingsRow
        label="Chat text size"
        description="Also Alt + scroll over the chat."
        stacked
      >
        <StopSlider
          label="Chat text size"
          value={feedFontSize()}
          stops={FONT_SIZE_STOPS}
          format={px}
          onChange={setFeedFontSize}
        />
      </SettingsRow>
      <SettingsRow
        label="Show display names"
        description="Display names instead of logins."
      >
        <Toggle
          label="Show display names"
          checked={feedUserShowDisplayName()}
          onChange={setFeedUserShowDisplayName}
        />
      </SettingsRow>
      <SettingsRow
        label="One colour for all names"
        description="Reset to bring back each chatter's own colour."
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
