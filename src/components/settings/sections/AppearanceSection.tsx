import { For } from "solid-js";
import SettingsContent from "../SettingsContent.tsx";
import SettingsContentSection from "../SettingsContentSection.tsx";
import SettingsContentSectionItem from "../SettingsContentSectionItem.tsx";
import Button from "../../ui/Button.tsx";
import ColorPicker from "../../ui/ColorPicker.tsx";
import {
  appearanceColors,
  setAppearanceColor,
  resetAppearanceColor,
  resetAppearanceColors,
} from "../../../lib/stores/preferences.ts";
import {
  APPEARANCE_COLOR_GROUPS,
  readAppearanceColorHex,
  type AppearanceColorKey,
} from "../../../lib/services/appearance.ts";

function AppearanceColorRow(props: { colorKey: AppearanceColorKey }) {
  const override = () => appearanceColors()[props.colorKey];
  const pickerValue = () => override() ?? readAppearanceColorHex(props.colorKey);
  return (
    <ColorPicker
      swatchColor={`var(--color-${props.colorKey})`}
      value={pickerValue()}
      onInput={(hex) => setAppearanceColor(props.colorKey, hex)}
      onReset={() => resetAppearanceColor(props.colorKey)}
      resetDisabled={!override()}
    />
  );
}

export default function AppearanceSection() {
  return (
    <SettingsContent title="Appearance">
      <SettingsContentSection>
        <div class="flex items-center justify-between">
          <span class="text-text-muted text-xs">
            Customize the colors used throughout the app. Click a swatch to pick a new color.
          </span>
          <Button
            variant="secondary"
            disabled={Object.keys(appearanceColors()).length === 0}
            onClick={() => resetAppearanceColors()}
          >
            Reset all
          </Button>
        </div>
      </SettingsContentSection>
      <For each={APPEARANCE_COLOR_GROUPS}>
        {(group) => (
          <SettingsContentSection title={group.label}>
            <For each={group.colors}>
              {(c) => (
                <SettingsContentSectionItem label={c.label}>
                  <AppearanceColorRow colorKey={c.key} />
                </SettingsContentSectionItem>
              )}
            </For>
          </SettingsContentSection>
        )}
      </For>
    </SettingsContent>
  );
}
