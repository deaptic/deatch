import { For } from "solid-js";
import SettingsContent from "../SettingsContent";
import SettingsContentSection from "../SettingsContentSection";
import SettingsContentSectionItem from "../SettingsContentSectionItem";
import Button from "../../ui/Button";
import {
  appearanceColors,
  setAppearanceColor,
  resetAppearanceColor,
  resetAppearanceColors,
} from "../../../lib/stores/preferences";
import {
  APPEARANCE_COLOR_GROUPS,
  readAppearanceColorHex,
  type AppearanceColorKey,
} from "../../../lib/services/appearance";

function AppearanceColorRow(props: { colorKey: AppearanceColorKey }) {
  const override = () => appearanceColors()[props.colorKey];
  const pickerValue = () => override() ?? readAppearanceColorHex(props.colorKey);
  return (
    <div class="flex items-center gap-2">
      <label
        class="relative w-8 h-8 rounded border border-border cursor-pointer overflow-hidden"
        style={{ "background-color": `var(--color-${props.colorKey})` }}
        title="Pick color"
      >
        <input
          type="color"
          class="absolute inset-0 opacity-0 cursor-pointer"
          value={pickerValue()}
          onInput={(e) => setAppearanceColor(props.colorKey, e.currentTarget.value)}
        />
      </label>
      <Button
        variant="secondary"
        disabled={!override()}
        onClick={() => resetAppearanceColor(props.colorKey)}
      >
        Reset
      </Button>
    </div>
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
