import Card from "../../ui/Card.tsx";
import CardLabel from "../../ui/CardLabel.tsx";
import ColorPicker from "../../ui/ColorPicker.tsx";
import Segmented from "../../ui/Segmented.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import * as appearance from "../../../lib/services/appearance.ts";
import type { Theme } from "../../../lib/constants/theme.ts";
import {
  appearanceAccent,
  appearanceTheme,
  setAppearanceAccent,
  setAppearanceTheme,
} from "../../../lib/stores/preferences.ts";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

export default function ThemeCard() {
  return (
    <Card>
      <CardLabel>Theme</CardLabel>
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
          value={appearanceAccent() ?? appearance.defaultAccentHex}
          onInput={setAppearanceAccent}
          onReset={() => setAppearanceAccent(null)}
          resetDisabled={appearanceAccent() === null}
        />
      </SettingsRow>
    </Card>
  );
}
