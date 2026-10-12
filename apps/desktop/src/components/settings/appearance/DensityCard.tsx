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

const UI_DENSITY_OPTIONS: { value: UiDensity; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "default", label: "Default" },
  { value: "spacious", label: "Spacious" },
];

const MESSAGE_DISPLAY_OPTIONS: { value: Density; label: string }[] = [
  { value: "compact", label: "Default" },
  { value: "comfortable", label: "Spacious" },
];

const px = (value: number) => `${value}px`;
const percent = (value: number) => `${value}%`;

export default function DensityCard() {
  return (
    <Card>
      <CardLabel>Layout</CardLabel>
      <SettingsRow
        label="Channel list spacing"
        description="How much room each channel takes in the list on the left."
      >
        <Segmented
          value={appearanceUiDensity()}
          options={UI_DENSITY_OPTIONS}
          onChange={setAppearanceUiDensity}
        />
      </SettingsRow>
      <SettingsRow
        label="Message layout"
        description="Default fits the most chat on screen. Spacious groups each chatter's messages under their name and picture. Alt+D switches."
      >
        <Segmented
          value={feedDensity()}
          options={MESSAGE_DISPLAY_OPTIONS}
          onChange={setFeedDensity}
        />
      </SettingsRow>
      <SettingsRow
        label="Space between message groups"
        description="Only in the spacious layout."
        stacked
      >
        <StopSlider
          label="Space between message groups"
          disabled={feedDensity() !== "comfortable"}
          value={feedGroupSpacing()}
          stops={GROUP_SPACING_STOPS}
          format={px}
          onChange={setFeedGroupSpacing}
        />
      </SettingsRow>
      <SettingsRow
        label="Zoom"
        description="Make everything bigger or smaller. Ctrl + and Ctrl − also work, Ctrl 0 resets."
        stacked
      >
        <StopSlider
          label="Zoom"
          value={appearanceZoom()}
          stops={ZOOM_STOPS}
          format={percent}
          onChange={setAppearanceZoom}
        />
      </SettingsRow>
    </Card>
  );
}
