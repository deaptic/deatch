import PageBody from "../../ui/PageBody.tsx";
import Card from "../../ui/Card.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import ColorPicker from "../../ui/ColorPicker.tsx";
import Segmented from "../../ui/Segmented.tsx";
import Slider from "../../ui/Slider.tsx";
import {
  appearanceAccent,
  appearanceTheme,
  feedFontSize,
  setAppearanceAccent,
  setAppearanceTheme,
  setFeedFontSize,
} from "../../../lib/stores/preferences.ts";
import { defaultAccentHex } from "../../../lib/services/appearance.ts";
import { type Theme } from "../../../lib/constants/theme.ts";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

export default function AppearanceSection() {
  return (
    <PageBody
      title="Appearance"
      lede="How Deatch looks. Changes apply immediately."
    >
      <Card>
        <SettingsRow label="Theme" description="Follow Windows, or pick one.">
          <Segmented
            value={appearanceTheme()}
            options={THEME_OPTIONS}
            onChange={setAppearanceTheme}
          />
        </SettingsRow>
        <SettingsRow
          label="Accent"
          description="Used for selection, buttons, and mentions of you."
        >
          <ColorPicker
            swatchColor="var(--color-accent)"
            value={appearanceAccent() ?? defaultAccentHex}
            onInput={setAppearanceAccent}
            onReset={() => setAppearanceAccent(null)}
            resetDisabled={appearanceAccent() === null}
          />
        </SettingsRow>
        <SettingsRow
          label="Chat text size"
          description="Also Ctrl + scroll over the chat."
        >
          <Slider
            label="Chat text size"
            value={feedFontSize()}
            min={12}
            max={22}
            onChange={setFeedFontSize}
          />
        </SettingsRow>
      </Card>
    </PageBody>
  );
}
